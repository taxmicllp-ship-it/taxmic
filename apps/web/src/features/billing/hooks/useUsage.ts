import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billing-api';

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => billingApi.getUsage(),
  });
}
