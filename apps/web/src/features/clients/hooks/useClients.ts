import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clients-api';
import { ClientsListParams } from '../types';

export function useClients(params?: ClientsListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.list(params),
  });
}
