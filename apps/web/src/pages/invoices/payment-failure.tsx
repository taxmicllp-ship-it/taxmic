import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payment Failed</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Your payment could not be processed. You have not been charged.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to={invoiceId ? `/invoices/${invoiceId}` : '/invoices'}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </Link>
          <Link
            to="/invoices"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  );
}
