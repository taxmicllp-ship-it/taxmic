import { useQuery } from '@tanstack/react-query';
import { portalApiClient } from '../api/portal-api';

export function usePortalTasks() {
  return useQuery({
    queryKey: ['portal', 'tasks'],
    queryFn: portalApiClient.listTasks,
  });
}
