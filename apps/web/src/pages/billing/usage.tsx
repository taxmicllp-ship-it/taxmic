import { useUsage } from '../../features/billing/hooks/useUsage';

function getBarColor(pct: number): string {
  if (pct > 95) return 'bg-red-500';
  if (pct > 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const barColor = isUnlimited ? 'bg-green-500' : getBarColor(pct);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {current} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        {!isUnlimited && (
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {isUnlimited && (
          <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
        )}
      </div>
    </div>
  );
}

export default function UsagePage() {
  const { data: usage, isLoading } = useUsage();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Usage</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading usage...</p>
      ) : !usage ? (
        <p className="text-sm text-gray-500">No usage data available.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 max-w-lg flex flex-col gap-6">
          <UsageBar label="Users" current={usage.users} limit={usage.limits.max_users} />
          <UsageBar label="Clients" current={usage.clients} limit={usage.limits.max_clients} />
          <UsageBar
            label="Storage (GB)"
            current={parseFloat(usage.storage_gb.toFixed(2))}
            limit={usage.limits.max_storage_gb}
          />
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
            <p>Documents: {usage.documents}</p>
          </div>
        </div>
      )}
    </div>
  );
}
