import { Invoice } from '../types';

interface InvoicePDFProps {
  invoice: Invoice;
  firmName?: string;
  invoicePrefix?: string;
}

function fmt(val: string | number) {
  return parseFloat(String(val)).toFixed(2);
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function InvoicePDF({ invoice, firmName = 'Your Firm', invoicePrefix = 'INV-' }: InvoicePDFProps) {
  const label = `${invoicePrefix}${String(invoice.number).padStart(4, '0')}`;

  return (
    <div className="bg-white text-gray-900 p-10 max-w-2xl mx-auto text-sm font-sans print:shadow-none shadow-lg rounded-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xl font-bold">{firmName}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{label}</p>
          <p className="text-gray-500 mt-1">Issue Date: {fmtDate(invoice.issue_date)}</p>
          <p className="text-gray-500">Due Date: {fmtDate(invoice.due_date)}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
        <p className="font-medium">{(invoice as any).client?.name ?? '—'}</p>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-gray-300 text-left text-xs text-gray-500 uppercase">
            <th className="pb-2">Description</th>
            <th className="pb-2 text-right w-16">Qty</th>
            <th className="pb-2 text-right w-24">Unit Price</th>
            <th className="pb-2 text-right w-24">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoice_items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">${fmt(item.unit_price)}</td>
              <td className="py-2 text-right">${fmt(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>${fmt(invoice.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span><span>${fmt(invoice.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1">
            <span>Total</span><span>${fmt(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
