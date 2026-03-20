import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import InvoiceStatusBadge from '../../invoices/components/InvoiceStatusBadge';
import TaskStatusBadge from '../../tasks/components/TaskStatusBadge';
import { InvoiceStatus } from '../../invoices/types';
import { TaskStatus } from '../../tasks/types';

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  total: number;
  due_date: string | null;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
}

interface Props {
  clientId: string;
}

function SectionHeader({
  title,
  isExpanded,
  onToggle,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left"
    >
      <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
      <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
    </button>
  );
}

function ContactsSection({ clientId }: { clientId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery<Contact[]>({
    queryKey: ['contacts', { clientId }],
    queryFn: () => api.get(`/contacts?clientId=${clientId}`).then((r) => r.data),
    enabled: isExpanded,
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <SectionHeader title="Contacts" isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
      {isExpanded && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
          {isError && <p className="text-sm text-red-500">Failed to load contacts.</p>}
          {data && data.length === 0 && <p className="text-sm text-gray-400">No contacts found.</p>}
          {data && data.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {data.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/contacts/${contact.id}/edit`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {contact.name}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-300">{contact.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function InvoicesSection({ clientId }: { clientId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ['invoices', { clientId }],
    queryFn: () => api.get(`/invoices?clientId=${clientId}`).then((r) => r.data),
    enabled: isExpanded,
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <SectionHeader title="Invoices" isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
      {isExpanded && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
          {isError && <p className="text-sm text-red-500">Failed to load invoices.</p>}
          {data && data.length === 0 && <p className="text-sm text-gray-400">No invoices found.</p>}
          {data && data.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 pr-4">Number</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      ${Number(invoice.total).toFixed(2)}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-300">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function TasksSection({ clientId }: { clientId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks', { clientId }],
    queryFn: () => api.get(`/tasks?clientId=${clientId}`).then((r) => r.data),
    enabled: isExpanded,
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <SectionHeader title="Tasks" isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
      {isExpanded && (
        <div className="mt-4">
          {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
          {isError && <p className="text-sm text-red-500">Failed to load tasks.</p>}
          {data && data.length === 0 && <p className="text-sm text-gray-400">No tasks found.</p>}
          {data && data.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((task) => (
                  <tr key={task.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-300">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const LinkedRecordsPanel: React.FC<Props> = ({ clientId }) => {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <ContactsSection clientId={clientId} />
      <InvoicesSection clientId={clientId} />
      <TasksSection clientId={clientId} />
    </div>
  );
};

export default LinkedRecordsPanel;
