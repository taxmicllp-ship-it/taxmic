import { prisma } from '@repo/database';
import { AppError } from '../../../shared/utils/errors';
import { subscriptionsRepository } from './subscriptions.repository';
import type { UsageSummary } from './subscriptions.types';

class UsageService {
  async getUsageSummary(firmId: string): Promise<UsageSummary> {
    const [users, clients, documents, storageRow, subscription] = await Promise.all([
      prisma.users.count({ where: { firm_id: firmId, is_active: true, deleted_at: null } }),
      prisma.clients.count({ where: { firm_id: firmId, deleted_at: null } }),
      prisma.documents.count({ where: { firm_id: firmId, deleted_at: null } }),
      prisma.storage_usage.findFirst({ where: { firm_id: firmId } }),
      subscriptionsRepository.findByFirmId(firmId),
    ]);

    const storage_gb = Number(storageRow?.total_bytes ?? 0) / 1024 ** 3;
    const plan = subscription?.plan ?? null;

    return {
      users,
      clients,
      documents,
      storage_gb,
      limits: {
        max_users: plan?.max_users ?? null,
        max_clients: plan?.max_clients ?? null,
        max_storage_gb: plan?.max_storage_gb ?? null,
      },
    };
  }

  async checkUserLimit(firmId: string): Promise<void> {
    const subscription = await subscriptionsRepository.findByFirmId(firmId);
    if (!subscription) return;

    const plan = subscription.plan;
    if (plan.max_users === null) return;

    const count = await prisma.users.count({
      where: { firm_id: firmId, is_active: true, deleted_at: null },
    });

    if (count >= plan.max_users) {
      throw new AppError('User limit reached for your plan', 403, 'PLAN_LIMIT_EXCEEDED');
    }
  }

  async checkClientLimit(firmId: string): Promise<void> {
    const subscription = await subscriptionsRepository.findByFirmId(firmId);
    if (!subscription) return;

    const plan = subscription.plan;
    if (plan.max_clients === null) return;

    const count = await prisma.clients.count({
      where: { firm_id: firmId, deleted_at: null },
    });

    if (count >= plan.max_clients) {
      throw new AppError('Client limit reached for your plan', 403, 'PLAN_LIMIT_EXCEEDED');
    }
  }

  async checkStorageLimit(firmId: string, additionalBytes: number): Promise<void> {
    const subscription = await subscriptionsRepository.findByFirmId(firmId);
    if (!subscription) return;

    const plan = subscription.plan;
    if (plan.max_storage_gb === null) return;

    const row = await prisma.storage_usage.findFirst({ where: { firm_id: firmId } });
    const currentBytes = Number(row?.total_bytes ?? 0);
    const limitBytes = plan.max_storage_gb * 1024 ** 3;

    if (currentBytes + additionalBytes > limitBytes) {
      throw new AppError('Storage limit reached for your plan', 403, 'PLAN_LIMIT_EXCEEDED');
    }
  }
}

export const usageService = new UsageService();
