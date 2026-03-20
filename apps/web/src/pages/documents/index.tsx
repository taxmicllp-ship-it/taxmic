import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useFolders, useCreateFolder } from '../../features/documents/hooks/useFolders';
import { useDocuments, useDeleteDocument } from '../../features/documents/hooks/useDocuments';
import { useUpload } from '../../features/documents/hooks/useUpload';
import FolderTree from '../../features/documents/components/FolderTree';
import DocumentList from '../../features/documents/components/DocumentList';
import DocumentUpload from '../../features/documents/components/DocumentUpload';
import Button from '../../components/ui/Button';

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: folders = [], isLoading: foldersLoading } = useFolders(clientId);
  const { data: documents = [], isLoading: docsLoading } = useDocuments(clientId, selectedFolderId);
  const createFolder = useCreateFolder(clientId);
  const upload = useUpload(clientId);
  const deleteDoc = useDeleteDocument(clientId);

  if (!clientId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-3">No client selected.</p>
        <Link to="/clients" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
          ← Go to Clients
        </Link>
      </div>
    );
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({ name: newFolderName.trim() });
    setNewFolderName('');
    setShowNewFolder(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setShowNewFolder(!showNewFolder)}>
            New Folder
          </Button>
          <DocumentUpload
            folders={folders}
            onUpload={(folderId, file) => upload.mutate({ folderId, file })}
            isUploading={upload.isPending}
          />
        </div>
      </div>

      {showNewFolder && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={createFolder.isPending}>
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewFolder(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {!foldersLoading && (
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
          />
        )}

        <div className="flex-1">
          {docsLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <DocumentList
              documents={documents}
              onDelete={(id) => deleteDoc.mutate(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
