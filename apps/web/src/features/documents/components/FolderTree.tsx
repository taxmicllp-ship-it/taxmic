import React from 'react';
import { Folder } from '../types';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId?: string;
  onSelect: (folderId: string | undefined) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ folders, selectedFolderId, onSelect }) => {
  return (
    <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Folders</p>
      <button
        onClick={() => onSelect(undefined)}
        className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 ${
          !selectedFolderId
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        All Documents
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder.id)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm mb-1 truncate ${
            selectedFolderId === folder.id
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          title={folder.name}
        >
          📁 {folder.name}
        </button>
      ))}
    </div>
  );
};

export default FolderTree;
