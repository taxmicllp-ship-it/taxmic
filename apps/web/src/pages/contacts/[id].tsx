import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { contactsApi } from '../../features/contacts/api/contacts-api';
import { getErrorMessage } from '../../lib/getErrorMessage';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => contactsApi.delete(id!),
    onSuccess: () => navigate('/contacts'),
    onError: (err) => setDeleteError(getErrorMessage(err)),
  });

  const handleDelete = () => {
    if (window.confirm('Delete this contact?')) {
      setDeleteError(null);
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const is404 = (error as any)?.response?.status === 404;

  if (error && is404) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Contact not found.</p>
        <Link to="/contacts" className="text-sm text-brand-500 hover:underline">← Contacts</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Error" message={getErrorMessage(error)} />
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link
        to="/contacts"
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← Contacts
      </Link>

      {/* Heading */}
      <h1 className="mt-4 mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
        {contact.name}
      </h1>

      {/* Detail card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-sm text-gray-900 dark:text-white">{displayValue(contact.name)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm text-gray-900 dark:text-white">{displayValue(contact.email)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-sm text-gray-900 dark:text-white">{displayValue(contact.phone)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title / Position</p>
            <p className="text-sm text-gray-900 dark:text-white">{displayValue(contact.title)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{displayValue(contact.notes)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Link to={`/contacts/${id}/edit`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="mt-4">
          <Alert variant="error" title="Delete failed" message={deleteError} />
        </div>
      )}
    </div>
  );
}
