import { useCurrentSubscription, useSubscriptionHistory } from '../../features/billing/hooks/useSubscription';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';

export default function HistoryPage() {
  const { data: subscription, isLoading: loadingSub } = useCurrentSubscription();
  const { data: events, isLoading: loadingEvents } = useSubscriptionHistory(subscription?.id ?? '');

  const isLoading = loadingSub || loadingEvents;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Billing History</h1>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading history...</p>
      ) : !subscription ? (
        <p className="text-sm text-gray-500">No subscription found.</p>
      ) : !events?.length ? (
        <p className="text-sm text-gray-500">No billing history found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Event Type</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">From Status</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">To Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} className="border-t border-gray-200 dark:border-gray-700">
                  <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {event.event_type}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {event.from_status ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {event.to_status ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
