import api from '../../../lib/api';
import {
  Invoice,
  InvoicesListResponse,
  InvoicesListParams,
  CreateInvoicePayload,
  UpdateInvoicePayload,
} from '../types';

export const invoicesApi = {
  list: (params?: InvoicesListParams) =>
    api.get<InvoicesListResponse>('/invoices', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Invoice>(`/invoices/${id}`).then((r) => r.data),

  create: (data: CreateInvoicePayload) =>
    api.post<Invoice>('/invoices', data).then((r) => r.data),

  update: (id: string, data: UpdateInvoicePayload) =>
    api.patch<Invoice>(`/invoices/${id}`, data).then((r) => r.data),

  send: (id: string) =>
    api.post<Invoice>(`/invoices/${id}/send`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/invoices/${id}`).then((r) => r.data),

  listByClient: (clientId: string) =>
    api.get<Invoice[]>(`/clients/${clientId}/invoices`).then((r) => r.data),
};
