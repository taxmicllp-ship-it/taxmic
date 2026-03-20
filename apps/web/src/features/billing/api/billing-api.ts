import api from '../../../lib/api';
import {
  Plan,
  Subscription,
  UsageSummary,
  SubscriptionEvent,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
} from '../types';

export interface CreatePlanPayload {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_annual: number;
  max_users?: number;
  max_clients?: number;
  max_storage_gb?: number;
  sort_order?: number;
  stripe_price_id?: string;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export const billingApi = {
  getPlans: () =>
    api.get<Plan[]>('/plans').then((r) => r.data),

  getCurrentSubscription: () =>
    api.get<Subscription | null>('/subscriptions/current').then((r) => r.data),

  createCheckoutSession: (planId: string) =>
    api.post<{ url: string }>('/subscriptions/checkout-session', { planId }).then((r) => r.data),

  createSubscription: (data: CreateSubscriptionPayload) =>
    api.post<Subscription>('/subscriptions', data).then((r) => r.data),

  getSubscription: (id: string) =>
    api.get<Subscription>(`/subscriptions/${id}`).then((r) => r.data),

  updateSubscription: (id: string, data: UpdateSubscriptionPayload) =>
    api.patch<Subscription>(`/subscriptions/${id}`, data).then((r) => r.data),

  cancelSubscription: (id: string) =>
    api.delete<Subscription>(`/subscriptions/${id}`).then((r) => r.data),

  getUsage: () =>
    api.get<UsageSummary>('/usage').then((r) => r.data),

  getHistory: (subscriptionId: string) =>
    api.get<SubscriptionEvent[]>(`/subscriptions/${subscriptionId}/history`).then((r) => r.data),

  listAllPlans: () =>
    api.get<Plan[]>('/admin/plans').then((r) => r.data),

  createPlan: (data: CreatePlanPayload) =>
    api.post<Plan>('/admin/plans', data).then((r) => r.data),

  updatePlan: (id: string, data: UpdatePlanPayload) =>
    api.patch<Plan>(`/admin/plans/${id}`, data).then((r) => r.data),

  deactivatePlan: (id: string) =>
    api.delete<Plan>(`/admin/plans/${id}`).then((r) => r.data),
};
