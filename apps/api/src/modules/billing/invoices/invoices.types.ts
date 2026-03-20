export interface CreateLineItemDto {
  description: string;
  quantity: string;
  unit_price: string;
  sort_order?: number;
}

export interface CreateInvoiceDto {
  client_id: string;
  issue_date: string;
  due_date?: string;
  tax_amount?: string;
  notes?: string;
  items: CreateLineItemDto[];
}

export interface UpdateInvoiceDto {
  client_id?: string;
  issue_date?: string;
  due_date?: string;
  tax_amount?: string;
  notes?: string;
  items?: CreateLineItemDto[];
}

export interface ListInvoicesQuery {
  status?: string;
  client_id?: string;
  due_date?: string;
  page: number;
  limit: number;
}

export interface InvoiceTotals {
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
}
