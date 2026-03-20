export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripe_price_id: string | null;
  max_users: number | null;
  max_clients: number | null;
  max_storage_gb: number | null;
  price_monthly: number;
  price_annual: number;
  features: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  firm_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  canceled_at: Date | null;
  trial_start: Date | null;
  trial_end: Date | null;
  created_at: Date;
  updated_at: Date;
  plan?: Plan;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface UsageSummary {
  users: number;
  clients: number;
  documents: number;
  storage_gb: number;
  limits: {
    max_users: number | null;
    max_clients: number | null;
    max_storage_gb: number | null;
  };
}

export interface CreateSubscriptionDto {
  planId: string;
  paymentMethodId: string;
}

export interface UpdateSubscriptionDto {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}
