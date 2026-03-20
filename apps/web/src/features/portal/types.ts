export interface PortalDocument {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: string;
  created_at: string;
}

export interface PortalInvoice {
  id: string;
  number: number;
  status: string;
  total_amount: string;
  due_date: string | null;
  paid_at: string | null;
}

export interface PortalInvoiceDetail {
  id: string;
  number: number;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface PortalTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface PortalDashboard {
  document_count: number;
  invoice_count: number;
  outstanding_invoice_count: number;
  task_count: number;
}
