import { Link, useSearchParams } from 'react-router-dom';

export default function PortalPaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payment Received</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {invoiceId
            ? 'Payment received. Your invoice has been updated.'
            : 'Your payment has been processed successfully.'}
        </p>
        <div className="mt-6">
          <Link
            to="/portal/invoices"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    </div>
  );
}
