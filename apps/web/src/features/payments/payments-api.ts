import api from '../../lib/api';
import { Payment } from '../invoices/types';

export interface CreateCheckoutSessionPayload {
  invoice_id: string;
  success_url: string;
  cancel_url: string;
}

export const paymentsApi = {
  createCheckoutSession: (data: CreateCheckoutSessionPayload) =>
    api.post<{ url: string }>('/payments/checkout-session', data).then((r) => r.data),

  listByClient: (clientId: string) =>
    api.get<Payment[]>(`/clients/${clientId}/payments`).then((r) => r.data),
};
