import { useRef } from 'react';
import Alert from '../../components/ui/Alert';
import { usePortalDocuments, useUploadDocument } from '../../features/portal/hooks/usePortalDocuments';
import { portalApiClient } from '../../features/portal/api/portal-api';
import { getErrorMessage } from '../../lib/getErrorMessage';

function formatBytes(bytes: string | number) {
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalDocumentsPage() {
  const { data: documents, isLoading } = usePortalDocuments();
  const { mutate: upload, isPending, isSuccess, isError, error } = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDownload = async (id: string, filename: string) => {
    const { url } = await portalApiClient.downloadDocument(id);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Documents</h1>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Uploading...' : 'Upload File'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {isSuccess && (
        <div className="mb-4">
          <Alert variant="success" title="Upload successful" message="Your file has been uploaded." />
        </div>
      )}
      {isError && (
        <div className="mb-4">
          <Alert variant="error" title="Upload failed" message={getErrorMessage(error)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : !documents?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No documents yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Filename</th>
                <th className="px-4 py-3 text-left font-medium">Size</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{doc.filename}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatBytes(doc.size_bytes)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(doc.id, doc.filename)}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
