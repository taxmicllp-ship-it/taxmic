import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalApiClient } from '../api/portal-api';

export function usePortalDocuments() {
  return useQuery({
    queryKey: ['portal', 'documents'],
    queryFn: portalApiClient.listDocuments,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => portalApiClient.uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'documents'] });
    },
  });
}
