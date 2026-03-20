import React, { useState } from 'react';
import { Document } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { documentsApi } from '../api/documents-api';

interface DocumentListProps {
  documents: Document[];
  onDelete: (documentId: string) => void;
}

function formatBytes(bytes: string): string {
  const n = parseInt(bytes, 10);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState('');

  const handleDownload = async (doc: Document) => {
    try {
      const { url, filename } = await documentsApi.getDownloadUrl(doc.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch {
      alert('Download failed');
    }
  };

  const handleConfirm = () => {
    onDelete(pendingDeleteId!);
    setConfirmOpen(false);
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No documents yet. Upload a file to get started.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</TableCell>
              <TableCell isHeader className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{doc.filename}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{doc.mime_type || '—'}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatBytes(doc.size_bytes)}</TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setPendingDeleteId(doc.id);
                        setPendingDeleteName(doc.filename);
                        setConfirmOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirm}
        title="Delete Document"
        message={`Delete "${pendingDeleteName}"? This cannot be undone.`}
        variant="danger"
      />
    </>
  );
};

export default DocumentList;
