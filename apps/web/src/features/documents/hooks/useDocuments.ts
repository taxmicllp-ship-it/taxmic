import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents-api';

export function useDocuments(clientId: string, folderId?: string) {
  return useQuery({
    queryKey: ['documents', clientId, folderId],
    queryFn: () => documentsApi.listDocuments(clientId, folderId),
    enabled: !!clientId,
  });
}

export function useDeleteDocument(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', clientId] });
    },
  });
}
