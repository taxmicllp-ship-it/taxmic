import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateClient } from '../../features/clients/hooks/useCreateClient';
import ClientForm from '../../features/clients/components/ClientForm';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function NewClientPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateClient();
  const [apiError, setApiError] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Client</h1>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-2xl">
        <ClientForm
          isPending={isPending}
          error={apiError}
          onSubmit={(data) => {
            setApiError(null);
            mutate(data, {
              onSuccess: (client) => navigate(`/clients/${client.id}`),
              onError: (err) => setApiError(getErrorMessage(err)),
            });
          }}
          onCancel={() => navigate('/clients')}
        />
      </div>
    </div>
  );
}
