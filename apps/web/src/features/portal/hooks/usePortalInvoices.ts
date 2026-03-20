import { useQuery, useMutation } from '@tanstack/react-query';
import { portalApiClient } from '../api/portal-api';

export function usePortalInvoices() {
  return useQuery({
    queryKey: ['portal', 'invoices'],
    queryFn: portalApiClient.listInvoices,
  });
}

export function usePayInvoice() {
  return useMutation({
    mutationFn: (id: string) => portalApiClient.payInvoice(id),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
