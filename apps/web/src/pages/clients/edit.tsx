import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../features/clients/hooks/useClient';
import { useUpdateClient } from '../../features/clients/hooks/useUpdateClient';
import ClientForm from '../../features/clients/components/ClientForm';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id!);
  const { mutate, isPending } = useUpdateClient(id!);
  const [apiError, setApiError] = useState<string | null>(null);

  if (isLoading) return <div className="py-8 text-center text-gray-400">Loading...</div>;
  if (!client) return <div className="py-8 text-center text-gray-400">Client not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Client</h1>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-2xl">
        <ClientForm
          initial={client}
          isPending={isPending}
          error={apiError}
          onSubmit={(data) => {
            setApiError(null);
            mutate(data, {
              onSuccess: () => navigate(`/clients/${id}`),
              onError: (err) => setApiError(getErrorMessage(err)),
            });
          }}
          onCancel={() => navigate(`/clients/${id}`)}
        />
      </div>
    </div>
  );
}
