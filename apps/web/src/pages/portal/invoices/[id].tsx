import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { portalApiClient } from '../../../features/portal/api/portal-api';
import InvoiceStatusBadge from '../../../features/invoices/components/InvoiceStatusBadge';
import Alert from '../../../components/ui/Alert';
import type { InvoiceStatus } from '../../../features/invoices/types';

export default function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['portal', 'invoices', id],
    queryFn: () => portalApiClient.getInvoice(id!),
    enabled: !!id,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const { mutate: pay, isPending: paying } = useMutation({
    mutationFn: () => portalApiClient.payInvoice(id!),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const is404 = (error as any)?.response?.status === 404;

  if (is404) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Invoice not found.</p>;
  }

  if (error) {
    return (
      <Alert
        variant="error"
        title="Error"
        message="Failed to load invoice. Please try again."
      />
    );
  }

  if (!invoice) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/portal/invoices"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        ← Invoices
      </Link>

      {/* Invoice header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invoice #{invoice.number}
            </h1>
            <div className="mt-2">
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
          </div>
          {invoice.status === 'sent' && (
            <button
              onClick={() => pay()}
              disabled={paying}
              className="inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {paying ? 'Redirecting...' : 'Pay'}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Issue Date</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Due Date</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Unit Price</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {invoice.line_items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                  No line items.
                </td>
              </tr>
            ) : (
              invoice.line_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.description}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    {parseFloat(String(item.quantity)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                    ${parseFloat(String(item.unit_price)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                    ${parseFloat(String(item.amount)).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>${parseFloat(String(invoice.subtotal_amount)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Tax</span>
            <span>${parseFloat(String(invoice.tax_amount)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900 dark:text-white font-semibold text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <span>Total</span>
            <span>${parseFloat(String(invoice.total_amount)).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
