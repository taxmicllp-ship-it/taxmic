export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'stripe' | 'check' | 'cash' | 'wire' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  sort_order: number;
}

export interface Payment {
  id: string;
  firm_id: string;
  invoice_id: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  reference_number: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  firm_id: string;
  client_id: string;
  number: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  subtotal_amount: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  invoice_items: InvoiceItem[];
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface LineItemInput {
  description: string;
  quantity: string;
  unit_price: string;
  sort_order?: number;
}

export interface CreateInvoicePayload {
  client_id: string;
  issue_date: string;
  due_date?: string;
  tax_amount?: string;
  notes?: string;
  items: LineItemInput[];
}

export type UpdateInvoicePayload = Partial<Omit<CreateInvoicePayload, 'items'>> & {
  items?: LineItemInput[];
};

export interface InvoicesListParams {
  status?: InvoiceStatus;
  client_id?: string;
  due_date?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesListResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
}
