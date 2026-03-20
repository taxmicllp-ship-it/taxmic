import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';
import { InvoicesListParams } from '../types';

export function useInvoices(params?: InvoicesListParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesApi.list(params),
  });
}
