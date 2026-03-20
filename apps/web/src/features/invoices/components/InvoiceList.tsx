import { useNavigate } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../types';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import Button from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';

interface InvoiceListProps {
  invoices: Invoice[];
  statusFilter?: InvoiceStatus | '';
  onStatusFilterChange?: (status: InvoiceStatus | '') => void;
}

export default function InvoiceList({ invoices, statusFilter = '', onStatusFilterChange }: InvoiceListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {onStatusFilterChange && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as InvoiceStatus | '')}
            className="rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Invoice #</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Issue Date</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Due Date</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    #{invoice.number}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    ${parseFloat(invoice.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
