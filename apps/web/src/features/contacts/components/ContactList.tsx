import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useContacts } from '../hooks/useContacts';
import { contactsApi } from '../api/contacts-api';
import Button from '../../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const ContactList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useContacts({ page, limit: 20, search: debouncedSearch || undefined });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
        <Link to="/contacts/new">
          <Button size="sm">+ New Contact</Button>
        </Link>
      </div>

      <div className="mb-4 max-w-sm">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-100 dark:border-gray-800">
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</TableCell>
              <TableCell isHeader className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell className="px-6 py-8 text-center text-gray-400" colSpan={5}>Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell className="px-6 py-8 text-center text-gray-400" colSpan={5}>No contacts found.</TableCell>
              </TableRow>
            )}
            {data?.data.map((contact) => (
              <TableRow key={contact.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <Link to={`/contacts/${contact.id}`} className="hover:text-brand-500 hover:underline">{contact.name}</Link>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500">{contact.email ?? '—'}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500">{contact.phone ?? '—'}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500">{contact.title ?? '—'}</TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/contacts/${contact.id}/edit`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(contact.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data && data.total > data.limit && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500">{data.total} total</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={data.data.length < data.limit} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
        onConfirm={handleConfirm}
        title="Delete Contact"
        message="Delete this contact? This cannot be undone."
        variant="danger"
      />
    </div>
  );
};

export default ContactList;
