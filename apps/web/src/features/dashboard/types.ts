export interface DashboardSummary {
  clients:   { total: number; active: number };
  contacts:  { total: number };
  tasks: {
    total: number;
    overdue: number;
    by_status: {
      new: number;
      in_progress: number;
      waiting_client: number;
      review: number;
      completed: number;
    };
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    total_outstanding_amount: string;
  };
  notifications: { unread_count: number };
}
