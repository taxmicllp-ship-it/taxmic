import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';

export function useSendInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => invoicesApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
