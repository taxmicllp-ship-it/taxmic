import { Link } from 'react-router-dom';
import InvoiceStatusBadge from '../../features/invoices/components/InvoiceStatusBadge';
import { usePortalInvoices, usePayInvoice } from '../../features/portal/hooks/usePortalInvoices';
import type { InvoiceStatus } from '../../features/invoices/types';

export default function PortalInvoicesPage() {
  const { data: invoices, isLoading } = usePortalInvoices();
  const { mutate: pay, isPending: paying, variables: payingId } = usePayInvoice();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Invoices</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : !invoices?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Number</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Due Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    <Link
                      to={`/portal/invoices/${inv.id}`}
                      className="hover:text-brand-500 transition-colors"
                    >
                      #{inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    ${parseFloat(inv.total_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === 'sent' && (
                      <button
                        onClick={() => pay(inv.id)}
                        disabled={paying && payingId === inv.id}
                        className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        {paying && payingId === inv.id ? 'Redirecting...' : 'Pay'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
