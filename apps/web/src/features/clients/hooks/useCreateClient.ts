import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients-api';
import { CreateClientInput } from '../types';

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientInput) => clientsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
