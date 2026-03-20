import { authRepository } from './auth.repository';
import { passwordService } from './password.service';
import { jwtStrategy } from './jwt.strategy';
import { AppError } from '../../shared/utils/errors';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { emailService } from '../notifications/email/email.service';
import { logSecurityEvent } from '../../shared/utils/security-audit';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponse,
} from './auth.types';

class AuthService {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingFirm = await authRepository.findFirmBySlug(dto.firmSlug);
    if (existingFirm) {
      throw new AppError('Firm slug already exists', 409, 'FIRM_SLUG_EXISTS');
    }

    const passwordHash = await passwordService.hash(dto.password);

    const ownerRole = await authRepository.findOwnerRole();
    if (!ownerRole) {
      throw new AppError('Owner role not found', 500, 'INTERNAL_ERROR');
    }

    const { firm, user } = await authRepository.createFirmWithOwner({
      firm: { name: dto.firmName, slug: dto.firmSlug, email: dto.firmEmail },
      user: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
      },
      ownerRoleId: ownerRole.id,
    });
    const token = jwtStrategy.sign({
      userId: user.id,
      firmId: firm.id,
      email: user.email,
      role: 'owner',
    });

    logger.info({ event: 'AUTH_REGISTER', userId: user.id, firmId: firm.id, email: user.email });

    // Audit log (non-blocking)
    logSecurityEvent({ eventType: 'register', firmId: firm.id, userId: user.id }).catch(() => {});

    // Send welcome email (non-blocking)
    emailService.sendEmail({
      to: user.email,
      subject: `Welcome to ${firm.name}`,
      templateName: 'welcome',
      firmId: firm.id,
      templateVars: {
        firstName: dto.firstName,
        firmName: firm.name,
        loginUrl: `${config.frontendUrl}/login`,
      },
    }).catch((err) => logger.warn({ event: 'WELCOME_EMAIL_FAILED', error: err }));

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        firmId: firm.id,
        firmName: firm.name,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmailAndFirmSlug(dto.email, dto.firmSlug);

    if (!user) {
      logger.warn({ event: 'AUTH_LOGIN_FAILURE', email: dto.email, firmSlug: dto.firmSlug });
      logSecurityEvent({ eventType: 'login_failure', metadata: { email: dto.email, firmSlug: dto.firmSlug } }).catch(() => {});
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const passwordMatch = await passwordService.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      logger.warn({ event: 'AUTH_LOGIN_FAILURE', email: dto.email, firmSlug: dto.firmSlug });
      logSecurityEvent({ eventType: 'login_failure', firmId: user.firm_id, userId: user.id, metadata: { reason: 'bad_password' } }).catch(() => {});
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    await authRepository.updateLastLogin(user.id);

    const role = user.user_roles[0]?.role?.name ?? 'member';

    logger.info({ event: 'AUTH_LOGIN_SUCCESS', userId: user.id, firmId: user.firm_id, email: user.email });
    logSecurityEvent({ eventType: 'login_success', firmId: user.firm_id, userId: user.id }).catch(() => {});

    const token = jwtStrategy.sign({
      userId: user.id,
      firmId: user.firm_id,
      email: user.email,
      role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        firmId: user.firm_id,
        firmName: user.firm.name,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await authRepository.findUserByEmail(dto.email);

    if (user) {
      const resetToken = jwtStrategy.signResetToken(user.id);
      const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

      logger.info({ event: 'AUTH_PASSWORD_RESET_REQUESTED', userId: user.id, email: user.email });
      logSecurityEvent({ eventType: 'password_reset_requested', firmId: user.firm_id, userId: user.id }).catch(() => {});

      // Send reset email (non-blocking)
      emailService.sendEmail({
        to: user.email,
        subject: 'Reset your password',
        templateName: 'password_reset',
        templateVars: {
          resetUrl: resetLink,
        },
      }).catch((err) => logger.warn({ event: 'RESET_EMAIL_FAILED', error: err }));
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const payload = jwtStrategy.verifyResetToken(dto.token);

    const passwordHash = await passwordService.hash(dto.password);

    await authRepository.updatePassword(payload.userId, passwordHash);

    logger.info({ event: 'AUTH_PASSWORD_RESET', userId: payload.userId });
    logSecurityEvent({ eventType: 'password_reset_completed', userId: payload.userId }).catch(() => {});
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const passwordMatch = await passwordService.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    const passwordHash = await passwordService.hash(newPassword);
    await authRepository.updatePassword(userId, passwordHash);

    logger.info({ event: 'AUTH_PASSWORD_CHANGED', userId });
    logSecurityEvent({ eventType: 'password_changed', userId }).catch(() => {});
  }

  /**
   * Add a user to an existing firm (future invite flow).
   * Enforces the plan's max_users limit before creating.
   */
  async addUserToFirm(firmId: string, dto: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
  }) {
    const { usageService } = await import('../billing/subscriptions/usage.service');
    await usageService.checkUserLimit(firmId);

    const passwordHash = await passwordService.hash(dto.password);
    const user = await authRepository.createUserInFirm({
      firmId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      roleId: dto.roleId,
    });

    logger.info({ event: 'USER_ADDED_TO_FIRM', firmId, userId: user.id });
    return user;
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const role = user.user_roles[0]?.role?.name ?? 'member';

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      firmId: user.firm_id,
      firmName: user.firm.name,
      role,
    };
  }

  async updateMe(userId: string, data: { first_name?: string; last_name?: string }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updated = await authRepository.updateUser(userId, {
      first_name: data.first_name,
      last_name: data.last_name,
    });

    logger.info({ event: 'USER_PROFILE_UPDATED', userId });

    const role = updated.user_roles[0]?.role?.name ?? 'member';

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      firmId: updated.firm_id,
      firmName: updated.firm.name,
      role,
    };
  }
}

export const authService = new AuthService();
