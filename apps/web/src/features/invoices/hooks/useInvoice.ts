import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}
