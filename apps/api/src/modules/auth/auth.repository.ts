import { prisma, firms, users, roles } from '@repo/database';
import { CreateFirmWithOwnerData } from './auth.types';

class AuthRepository {
  findUserByEmailAndFirmSlug(email: string, firmSlug: string) {
    return prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
        firm: { slug: firmSlug, deleted_at: null },
      },
      include: { firm: true, user_roles: { include: { role: true } } },
    });
  }

  findFirmBySlug(slug: string): Promise<firms | null> {
    return prisma.firms.findFirst({ where: { slug, deleted_at: null } });
  }

  findOwnerRole(): Promise<roles | null> {
    return prisma.roles.findFirst({ where: { name: 'owner' } });
  }

  createFirmWithOwner(data: CreateFirmWithOwnerData): Promise<{ firm: firms; user: users }> {
    return prisma.$transaction(async (tx) => {
      const firm = await tx.firms.create({
        data: {
          name: data.firm.name,
          slug: data.firm.slug,
          email: data.firm.email,
        },
      });

      const user = await tx.users.create({
        data: {
          firm_id: firm.id,
          email: data.user.email,
          password_hash: data.user.passwordHash,
          first_name: data.user.firstName,
          last_name: data.user.lastName,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: data.ownerRoleId,
          firm_id: firm.id,
        },
      });

      await tx.firm_settings.create({ data: { firm_id: firm.id } });
      await tx.user_settings.create({ data: { user_id: user.id } });

      return { firm, user };
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.users.update({ where: { id: userId }, data: { password_hash: passwordHash } });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.users.update({ where: { id: userId }, data: { last_login_at: new Date() } });
  }

  findUserByEmail(email: string) {
    return prisma.users.findFirst({ where: { email, deleted_at: null } });
  }

  findUserById(userId: string) {
    return prisma.users.findFirst({
      where: { id: userId, deleted_at: null },
      include: { firm: true, user_roles: { include: { role: true } } },
    });
  }

  async updateUser(userId: string, data: { first_name?: string; last_name?: string }) {
    return prisma.users.update({
      where: { id: userId },
      data,
      include: { firm: true, user_roles: { include: { role: true } } },
    });
  }

  async createUserInFirm(data: {
    firmId: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleId: string;
  }): Promise<users> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          firm_id: data.firmId,
          email: data.email,
          password_hash: data.passwordHash,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      });

      await tx.user_roles.create({
        data: { user_id: user.id, role_id: data.roleId, firm_id: data.firmId },
      });

      await tx.user_settings.create({ data: { user_id: user.id } });

      return user;
    });
  }
}

export const authRepository = new AuthRepository();
