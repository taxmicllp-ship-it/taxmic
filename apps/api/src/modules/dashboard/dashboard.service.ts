import { prisma } from '@repo/database';

export interface DateRangeFilter {
  start_date?: Date;
  end_date?: Date;
}

export interface DashboardSummaryResponse {
  clients:   { total: number; active: number };
  contacts:  { total: number };
  tasks:     { total: number; overdue: number; by_status: { new: number; in_progress: number; waiting_client: number; review: number; completed: number } };
  invoices:  { total: number; draft: number; sent: number; paid: number; overdue: number; total_outstanding_amount: string };
  notifications: { unread_count: number };
}

class DashboardService {
  async getSummary(firmId: string, userId: string, dateRange?: DateRangeFilter): Promise<DashboardSummaryResponse> {
    const now = new Date();

    // Build the created_at filter only when both dates are provided
    const createdAtFilter =
      dateRange?.start_date && dateRange?.end_date
        ? { gte: dateRange.start_date, lte: dateRange.end_date }
        : undefined;

    const [
      clientsAgg,
      clientsActive,
      contactsTotal,
      tasksTotal,
      tasksOverdue,
      tasksByStatus,
      invoicesTotal,
      invoicesByStatus,
      invoicesOutstanding,
      unreadCount,
    ] = await Promise.all([
      prisma.clients.aggregate({
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
        _count: true,
      }),
      prisma.clients.count({
        where: { firm_id: firmId, status: 'active', deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
      prisma.contacts.count({
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
      prisma.tasks.count({
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
      prisma.tasks.count({
        where: { firm_id: firmId, deleted_at: null, due_date: { lt: now }, status: { not: 'completed' }, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
      prisma.tasks.groupBy({
        by: ['status'],
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
        _count: true,
      }),
      // True total — includes all statuses (draft, sent, paid, overdue, cancelled, etc.)
      prisma.invoices.count({
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
      prisma.invoices.groupBy({
        by: ['status'],
        where: { firm_id: firmId, deleted_at: null, ...(createdAtFilter && { created_at: createdAtFilter }) },
        _count: true,
      }),
      prisma.invoices.aggregate({
        where: { firm_id: firmId, deleted_at: null, status: { in: ['sent', 'overdue'] }, ...(createdAtFilter && { created_at: createdAtFilter }) },
        _sum: { total_amount: true },
      }),
      // NOTE: unread_count here is a snapshot (fetched once on dashboard load).
      // The nav badge uses GET /notifications/unread-count with 60s polling and is the
      // authoritative real-time source. These two values may temporarily diverge — this is intentional.
      prisma.notifications.count({
        where: { firm_id: firmId, user_id: userId, is_read: false, ...(createdAtFilter && { created_at: createdAtFilter }) },
      }),
    ]);

    const byTaskStatus = { new: 0, in_progress: 0, waiting_client: 0, review: 0, completed: 0 };
    tasksByStatus.forEach(g => {
      byTaskStatus[g.status as keyof typeof byTaskStatus] = g._count;
    });

    const byInvoiceStatus = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    invoicesByStatus.forEach(g => {
      byInvoiceStatus[g.status as keyof typeof byInvoiceStatus] = g._count;
    });

    return {
      clients:  { total: clientsAgg._count, active: clientsActive },
      contacts: { total: contactsTotal },
      tasks:    { total: tasksTotal, overdue: tasksOverdue, by_status: byTaskStatus },
      invoices: {
        total: invoicesTotal,
        ...byInvoiceStatus,
        total_outstanding_amount: (invoicesOutstanding._sum.total_amount ?? 0).toFixed(2),
      },
      notifications: { unread_count: unreadCount },
    };
  }
}

export const dashboardService = new DashboardService();
