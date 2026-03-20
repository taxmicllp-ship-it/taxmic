import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents-api';
import { CreateFolderDto } from '../types';

export function useFolders(clientId: string) {
  return useQuery({
    queryKey: ['folders', clientId],
    queryFn: () => documentsApi.listFolders(clientId),
    enabled: !!clientId,
  });
}

export function useCreateFolder(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFolderDto) => documentsApi.createFolder(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', clientId] });
    },
  });
}
