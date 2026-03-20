import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentSubscription, useCancelSubscription } from '../../features/billing/hooks/useSubscription';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  past_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  canceled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: subscription, isLoading, refetch } = useCurrentSubscription();
  const { mutate: cancel, isPending: canceling } = useCancelSubscription(subscription?.id ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // After Stripe checkout redirect, force-refetch so the new subscription shows immediately
  useEffect(() => {
    if (searchParams.get('session_id')) {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      refetch();
    }
  }, [searchParams, queryClient, refetch]);

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading subscription...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Subscription</h1>
        {searchParams.get('session_id') ? (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
            Processing your subscription, please wait...
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No active subscription.</p>
        )}
        <Link to="/billing/plans">
          <Button variant="primary">View Plans</Button>
        </Link>
      </div>
    );
  }

  const handleConfirm = () => {
    cancel();
    setConfirmOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscription</h1>
        <Link to="/billing/plans">
          <Button variant="outline" size="sm">Change Plan</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 max-w-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {subscription.plan?.name ?? subscription.plan_id}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[subscription.status] ?? ''}`}>
            {subscription.status}
          </span>
        </div>
        {subscription.current_period_start && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Period Start</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(subscription.current_period_start).toLocaleDateString()}
            </span>
          </div>
        )}
        {subscription.current_period_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Period End</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>
        )}
        {subscription.cancel_at_period_end && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Cancels at end of current period.</p>
        )}
        {subscription.status !== 'canceled' && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={canceling}>
              {canceling ? 'Canceling...' : 'Cancel Subscription'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Cancel Subscription"
        message="Cancel your subscription? This cannot be undone."
        variant="warning"
        confirmLabel="Cancel Subscription"
      />
    </div>
  );
}
