import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';
import { CreateInvoicePayload } from '../types';

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoicePayload) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
