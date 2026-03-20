import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '../api/contacts-api';

export function useContacts(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.list(params),
  });
}
