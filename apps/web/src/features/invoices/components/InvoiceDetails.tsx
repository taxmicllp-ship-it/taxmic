import { Invoice } from '../types';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import LineItemsTable from './LineItemsTable';
import Button from '../../../components/ui/Button';
import PaymentButton from '../../payments/PaymentButton';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onSend?: () => void;
  isSending?: boolean;
}

export default function InvoiceDetails({ invoice, onSend, isSending }: InvoiceDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice #{invoice.number}</h2>
          <div className="mt-1">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && onSend && (
            <Button onClick={onSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          )}
          {invoice.status === 'sent' && (
            <PaymentButton invoiceId={invoice.id} />
          )}
          {invoice.pdf_url && (
            <a
              href={`/api/v1/documents/serve/${btoa(invoice.pdf_url + ':0')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Issue Date</p>
          <p className="text-sm text-gray-900 dark:text-white">{new Date(invoice.issue_date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
          </p>
        </div>
        {invoice.sent_at && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sent At</p>
            <p className="text-sm text-gray-900 dark:text-white">{new Date(invoice.sent_at).toLocaleString()}</p>
          </div>
        )}
        {invoice.paid_at && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Paid At</p>
            <p className="text-sm text-gray-900 dark:text-white">{new Date(invoice.paid_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <LineItemsTable items={invoice.invoice_items} />

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span><span>${parseFloat(invoice.subtotal_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Tax</span><span>${parseFloat(invoice.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1">
            <span>Total</span><span>${parseFloat(invoice.total_amount).toFixed(2)}</span>
          </div>
          {parseFloat(invoice.paid_amount) > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Paid</span><span>${parseFloat(invoice.paid_amount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {invoice.notes && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
