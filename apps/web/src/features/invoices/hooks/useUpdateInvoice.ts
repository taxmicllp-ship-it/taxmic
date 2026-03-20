import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';
import { UpdateInvoicePayload } from '../types';

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInvoicePayload) => invoicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
    },
  });
}
