import Button from '../../components/ui/Button';
import { usePayment } from './usePayment';

interface PaymentButtonProps {
  invoiceId: string;
}

export default function PaymentButton({ invoiceId }: PaymentButtonProps) {
  const { mutate, isPending } = usePayment();

  const handlePay = () => {
    const base = window.location.origin;
    mutate({
      invoice_id: invoiceId,
      success_url: `${base}/invoices/payment-success?invoice_id=${invoiceId}`,
      cancel_url: `${base}/invoices/${invoiceId}`,
    });
  };

  return (
    <Button onClick={handlePay} disabled={isPending}>
      {isPending ? 'Redirecting...' : 'Pay with Stripe'}
    </Button>
  );
}
