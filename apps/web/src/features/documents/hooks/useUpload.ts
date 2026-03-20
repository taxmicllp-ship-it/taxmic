import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents-api';

export function useUpload(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, file }: { folderId: string; file: File }) =>
      documentsApi.uploadDocument(folderId, clientId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
  });
}
