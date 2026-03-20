import React, { useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import { Folder } from '../types';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

interface DocumentUploadProps {
  folders: Folder[];
  onUpload: (folderId: string, file: File) => void;
  isUploading: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ folders, onUpload, isUploading }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);

    if (!file) return;
    if (!selectedFolderId) {
      setValidationError('Please select a folder first.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setValidationError('File size must be under 20MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Allowed file types: PDF, JPG, PNG, DOCX.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    onUpload(selectedFolderId, file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <select
          value={selectedFolderId}
          onChange={(e) => { setSelectedFolderId(e.target.value); setValidationError(null); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">Select folder...</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.docx" />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={!selectedFolderId || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>
      {validationError && (
        <p className="text-xs text-error-500 mt-1">{validationError}</p>
      )}
    </div>
  );
};

export default DocumentUpload;
