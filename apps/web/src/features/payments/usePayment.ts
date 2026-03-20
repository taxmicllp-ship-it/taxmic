import { useMutation } from '@tanstack/react-query';
import { paymentsApi, CreateCheckoutSessionPayload } from './payments-api';

export function usePayment() {
  return useMutation({
    mutationFn: (data: CreateCheckoutSessionPayload) =>
      paymentsApi.createCheckoutSession(data),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
