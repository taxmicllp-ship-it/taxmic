export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: string;
  price_annual: string;
  max_users: number | null;
  max_clients: number | null;
  max_storage_gb: number | null;
  features: Record<string, unknown> | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  firm_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface UsageLimits {
  max_users: number | null;
  max_clients: number | null;
  max_storage_gb: number | null;
}

export interface UsageSummary {
  users: number;
  clients: number;
  documents: number;
  storage_gb: number;
  limits: UsageLimits;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateSubscriptionPayload {
  planId: string;
  paymentMethodId: string;
}

export interface UpdateSubscriptionPayload {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}
