import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api/clients-api';

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.get(id),
    enabled: !!id,
  });
}
