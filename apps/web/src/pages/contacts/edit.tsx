import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../../features/contacts/api/contacts-api';
import ContactForm from '../../features/contacts/components/ContactForm';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => contactsApi.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
  });

  if (isLoading) return <div className="py-8 text-center text-gray-400">Loading...</div>;
  if (!contact) return <div className="py-8 text-center text-gray-400">Contact not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Contact</h1>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-2xl">
        <ContactForm
          initial={contact}
          isPending={isPending}
          error={apiError}
          onSubmit={(data) => {
            setApiError(null);
            mutate(data, { onError: (err) => setApiError(getErrorMessage(err)) });
          }}
          onCancel={() => navigate('/contacts')}
        />
      </div>
    </div>
  );
}
