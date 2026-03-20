import { useState } from 'react';
import { useNotifications, useMarkAsRead } from '../../features/notifications/hooks/useNotifications';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';

const TYPE_LABELS: Record<string, string> = {
  task_assigned: 'Task Assigned',
  task_completed: 'Task Completed',
  invoice_sent: 'Invoice Sent',
  invoice_paid: 'Invoice Paid',
  document_uploaded: 'Document Uploaded',
  comment_added: 'Comment Added',
  user_invited: 'User Invited',
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const params = filter === 'unread' ? { is_read: false } : undefined;
  const { data, isLoading } = useNotifications(params);
  const { mutate: markAsRead } = useMarkAsRead();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filter === 'unread' ? 'primary' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading notifications...</p>
      ) : !data?.data?.length ? (
        <p className="text-sm text-gray-500">No notifications.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Message</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((n) => (
                <TableRow key={n.id} className="border-t border-gray-200 dark:border-gray-700">
                  <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                    {n.title}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {n.message}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(n.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      n.is_read
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {n.is_read ? 'Read' : 'Unread'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {!n.is_read && (
                      <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>
                        Mark as read
                      </Button>
                    )}
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
