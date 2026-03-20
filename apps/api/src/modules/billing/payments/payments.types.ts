export interface CreatePaymentDto {
  invoice_id: string;
  amount: number;
  method: 'stripe' | 'check' | 'cash' | 'wire' | 'other';
  stripe_payment_intent_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface PaymentStatusPatch {
  status: string;
  paid_at?: Date | null;
  stripe_charge_id?: string | null;
  stripe_payment_intent_id?: string | null;
}
