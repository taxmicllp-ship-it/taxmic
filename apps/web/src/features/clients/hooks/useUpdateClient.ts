import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients-api';
import { UpdateClientInput } from '../types';

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClientInput) => clientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}
