import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoicesApi } from '../../../features/invoices/api/invoices-api';
import InvoiceForm from '../../../features/invoices/components/InvoiceForm';
import Alert from '../../../components/ui/Alert';
import { CreateInvoicePayload } from '../../../features/invoices/types';

export default function InvoiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const { mutate: updateInvoice, isPending, error } = useMutation({
    mutationFn: (data: CreateInvoicePayload) => invoicesApi.update(id!, data),
    onSuccess: () => navigate(`/invoices/${id}`),
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-6 text-sm text-gray-500">Invoice not found.</div>;

  const defaultValues = {
    client_id: invoice.client_id,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date ?? '',
    tax_amount: invoice.tax_amount,
    notes: invoice.notes ?? '',
    items: invoice.invoice_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: item.sort_order,
    })),
  };

  const errorMessage = error
    ? ((error as any)?.response?.data?.message ?? 'Failed to update invoice. Please try again.')
    : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Edit Invoice #{invoice.number}
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4">
          <Alert variant="error" title="Update failed" message={errorMessage} />
        </div>
      )}

      <div className="max-w-2xl">
        <InvoiceForm
          defaultValues={defaultValues}
          onSubmit={(data) => updateInvoice(data)}
          isLoading={isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
