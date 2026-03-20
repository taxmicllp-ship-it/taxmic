import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateContact } from '../../features/contacts/hooks/useCreateContact';
import ContactForm from '../../features/contacts/components/ContactForm';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function NewContactPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateContact();
  const [apiError, setApiError] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Contact</h1>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-2xl">
        <ContactForm
          isPending={isPending}
          error={apiError}
          onSubmit={(data) => {
            setApiError(null);
            mutate(data, {
              onSuccess: () => navigate('/contacts'),
              onError: (err) => setApiError(getErrorMessage(err)),
            });
          }}
          onCancel={() => navigate('/contacts')}
        />
      </div>
    </div>
  );
}
