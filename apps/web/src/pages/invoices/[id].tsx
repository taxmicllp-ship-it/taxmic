import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInvoice } from '../../features/invoices/hooks/useInvoice';
import { useSendInvoice } from '../../features/invoices/hooks/useSendInvoice';
import { invoicesApi } from '../../features/invoices/api/invoices-api';
import InvoiceDetails from '../../features/invoices/components/InvoiceDetails';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Alert from '../../components/ui/Alert';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: invoice, isLoading } = useInvoice(id!);
  const { mutate: sendInvoice, isPending: isSending } = useSendInvoice(id!);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { mutate: deleteInvoice } = useMutation({
    mutationFn: () => invoicesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate('/invoices');
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message ?? 'Failed to delete invoice. Please try again.');
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-6 text-sm text-gray-500">Invoice not found.</div>;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
          ← Back to Invoices
        </Button>
        {invoice.status === 'draft' && (
          <>
            <Link
              to={`/invoices/${id}/edit`}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Edit
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {deleteError && (
        <div className="mb-4">
          <Alert variant="error" title="Delete failed" message={deleteError} />
        </div>
      )}

      <div className="max-w-3xl">
        <InvoiceDetails
          invoice={invoice}
          onSend={() => sendInvoice()}
          isSending={isSending}
        />
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          deleteInvoice();
        }}
        title="Delete Invoice"
        message={`Delete invoice #${invoice.number}? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
