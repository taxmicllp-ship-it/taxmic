import React, { useEffect, useRef, useState } from 'react';
import { clientsApi } from '../../features/clients/api/clients-api';
import { Client } from '../../features/clients/types';
import { getErrorMessage } from '../../lib/getErrorMessage';

interface ClientPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  error?: boolean;
}

const ClientPicker: React.FC<ClientPickerProps> = ({ value, onChange, disabled = false, error = false }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Client[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce query → debouncedQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Resolve display name when value is provided on mount (edit mode)
  useEffect(() => {
    if (value && !query) {
      clientsApi.get(value)
        .then((client) => setSelectedName(client.name))
        .catch(() => setSelectedName(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery) return;
    const controller = new AbortController();
    setIsSearching(true);
    setSearchError('');
    clientsApi.list({ search: debouncedQuery, limit: 50 }, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setResults(res.data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setSearchError(getErrorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  // Outside-click close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (selectedName) {
      setSelectedName('');
      onChange(null);
    }
  };

  const handleSelect = (client: Client) => {
    onChange(client.id);
    setSelectedName(client.name);
    setQuery('');
    setOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setSelectedName('');
    setResults([]);
    setOpen(false);
    setSearchError('');
  };

  const inputValue = selectedName || query;

  const inputClasses = [
    'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs',
    'placeholder:text-gray-400 focus:outline-hidden focus:ring-3',
    'dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30',
    disabled
      ? 'text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
      : error
      ? 'border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800'
      : 'bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800',
    selectedName ? 'pr-10' : '',
  ].join(' ');

  const showDropdown = open && (results.length > 0 || isSearching || (debouncedQuery.length > 0 && !isSearching));

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (query) setOpen(true); }}
          placeholder="Search clients…"
          disabled={disabled}
          className={inputClasses}
          autoComplete="off"
        />
        {selectedName && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50 }}
          className="mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 max-h-60 overflow-y-auto"
        >
          {isSearching && (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              Searching…
            </div>
          )}
          {!isSearching && results.length === 0 && debouncedQuery.length > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No clients found
            </div>
          )}
          {results.map((client) => (
            <button
              key={client.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(client);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-white/90 dark:hover:bg-gray-800"
            >
              {client.name}
            </button>
          ))}
        </div>
      )}

      {searchError && (
        <p className="mt-1.5 text-xs text-error-500">{searchError}</p>
      )}
    </div>
  );
};

export default ClientPicker;
