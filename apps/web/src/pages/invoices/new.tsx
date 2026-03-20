import { useNavigate } from 'react-router-dom';
import { useCreateInvoice } from '../../features/invoices/hooks/useCreateInvoice';
import InvoiceForm from '../../features/invoices/components/InvoiceForm';
import { CreateInvoicePayload } from '../../features/invoices/types';
import { useState } from 'react';
import { getErrorMessage } from '../../lib/getErrorMessage';

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = (data: CreateInvoicePayload) => {
    setApiError(null);
    createInvoice(data, {
      onSuccess: (invoice) => navigate(`/invoices/${invoice.id}`),
      onError: (err) => setApiError(getErrorMessage(err)),
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">New Invoice</h1>
      </div>
      <div className="max-w-2xl">
        <InvoiceForm onSubmit={handleSubmit} isLoading={isPending} error={apiError} />
      </div>
    </div>
  );
}
