import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../shared/utils/errors';
import { JwtPayload, ResetTokenPayload } from './auth.types';

export { AppError };

class JwtStrategy {
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] });
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'TOKEN_INVALID');
    }
  }

  signResetToken(userId: string): string {
    return jwt.sign({ userId, type: 'password_reset' }, config.jwtSecret, { expiresIn: '1h' });
  }

  verifyResetToken(token: string): ResetTokenPayload {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as ResetTokenPayload;
      if (payload.type !== 'password_reset') {
        throw new AppError('Invalid reset token', 400, 'TOKEN_INVALID');
      }
      return payload;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Reset token expired', 400, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid reset token', 400, 'TOKEN_INVALID');
    }
  }
}

export const jwtStrategy = new JwtStrategy();
