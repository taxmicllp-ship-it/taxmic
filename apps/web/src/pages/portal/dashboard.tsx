import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { portalApiClient } from '../../features/portal/api/portal-api';

export default function PortalDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal', 'dashboard'],
    queryFn: portalApiClient.getDashboard,
  });

  const stats = [
    { label: 'Documents', count: data?.document_count, to: '/portal/documents' },
    { label: 'Invoices', count: data?.invoice_count, to: '/portal/invoices' },
    { label: 'Outstanding Invoices', count: data?.outstanding_invoice_count, to: '/portal/invoices' },
    { label: 'Tasks', count: data?.task_count, to: '/portal/tasks' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, count, to }) => (
            <Link
              key={label}
              to={to}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{count ?? 0}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
