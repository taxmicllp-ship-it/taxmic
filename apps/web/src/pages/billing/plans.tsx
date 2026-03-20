import { usePlans, useCreateCheckoutSession } from '../../features/billing/hooks/useSubscription';
import Button from '../../components/ui/Button';

export default function PlansPage() {
  const { data: plans = [], isLoading } = usePlans();
  const { mutate: startCheckout, isPending: redirecting } = useCreateCheckoutSession();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Plans</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading plans...</p>
      ) : !plans.length ? (
        <p className="text-sm text-gray-500">No plans available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col gap-4"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${parseFloat(plan.price_monthly).toFixed(2)}/mo
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${parseFloat(plan.price_annual).toFixed(2)}/yr
                </p>
              </div>
              <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium text-gray-900 dark:text-white">Limits</p>
                <p>Users: {plan.max_users ?? 'Unlimited'}</p>
                <p>Clients: {plan.max_clients ?? 'Unlimited'}</p>
                <p>Storage: {plan.max_storage_gb ? plan.max_storage_gb + ' GB' : 'Unlimited'}</p>
              </div>
              <div className="mt-auto">
                <Button
                  variant="primary"
                  disabled={redirecting}
                  onClick={() => startCheckout(plan.id)}
                >
                  {redirecting ? 'Redirecting...' : 'Subscribe'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
