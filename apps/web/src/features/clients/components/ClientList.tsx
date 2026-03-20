import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClients } from '../hooks/useClients';
import { clientsApi } from '../api/clients-api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/form/InputField';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  archived: 'bg-yellow-100 text-yellow-700',
  lead: 'bg-blue-100 text-blue-700',
};

const ClientList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useClients({ search: search || undefined, page, limit: 20 });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <Link to="/clients/new">
          <Button size="sm">+ New Client</Button>
        </Link>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-100 dark:border-gray-800">
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableCell>
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
                <TableCell className="px-6 py-8 text-center text-gray-400" colSpan={5}>No clients found.</TableCell>
              </TableRow>
            )}
            {data?.data.map((client) => (
              <TableRow key={client.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  <Link to={`/clients/${client.id}`} className="hover:text-brand-500">{client.name}</Link>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500">{client.email ?? '—'}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 capitalize">{client.type ?? '—'}</TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[client.status] ?? ''}`}>
                    {client.status}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/clients/${client.id}/edit`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(client.id)}>Delete</Button>
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
        title="Delete Client"
        message="Delete this client? This cannot be undone."
        variant="danger"
      />
    </div>
  );
};

export default ClientList;
