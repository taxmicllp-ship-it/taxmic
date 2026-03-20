import React from 'react';
import { Link } from 'react-router-dom';
import { useClient } from '../hooks/useClient';
import Button from '../../../components/ui/Button';
import LinkedRecordsPanel from './LinkedRecordsPanel';

interface Props {
  clientId: string;
}

const ClientDetails: React.FC<Props> = ({ clientId }) => {
  const { data: client, isLoading } = useClient(clientId);

  if (isLoading) return <div className="py-8 text-center text-gray-400">Loading...</div>;
  if (!client) return <div className="py-8 text-center text-gray-400">Client not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/clients" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Clients</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{client.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/documents?clientId=${clientId}`}>
            <Button size="sm" variant="outline">Documents</Button>
          </Link>
          <Link to={`/clients/${clientId}/edit`}>
            <Button size="sm">Edit</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90 mb-4">Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Email', client.email],
            ['Phone', client.phone],
            ['Type', client.type],
            ['Status', client.status],
            ['Tax ID', client.tax_id],
            ['Website', client.website],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</dt>
            <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client.notes}</dd>
          </div>
        )}
      </div>

      <LinkedRecordsPanel clientId={client.id} />
    </div>
  );
};

export default ClientDetails;
