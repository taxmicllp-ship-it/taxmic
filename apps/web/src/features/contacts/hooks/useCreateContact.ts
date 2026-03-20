import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../api/contacts-api';
import { CreateContactInput } from '../types';

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) => contactsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}
