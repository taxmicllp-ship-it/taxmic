import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '../../features/invoices/hooks/useInvoices';
import InvoiceList from '../../features/invoices/components/InvoiceList';
import Button from '../../components/ui/Button';
import { InvoiceStatus } from '../../features/invoices/types';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const { data, isLoading } = useInvoices(statusFilter ? { status: statusFilter } : undefined);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
        <Button onClick={() => navigate('/invoices/new')}>New Invoice</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading invoices...</p>
      ) : (
        <InvoiceList
          invoices={data?.data ?? []}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}
    </div>
  );
}
