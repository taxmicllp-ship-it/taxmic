import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useDashboardSummary } from '../features/dashboard/hooks/useDashboardSummary';
import Alert from '../components/ui/Alert';
import DateRangePicker, { type DateRange } from '../components/ui/DateRangePicker';
import type { DashboardSummary } from '../features/dashboard/types';

// ─────────────────────────────────────────────────────────────────
// KPI Bar
// ─────────────────────────────────────────────────────────────────
function KPIBar({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  const fmt = (n?: number) => (isLoading || n == null ? '—' : n.toLocaleString());

  const stats = [
    {
      label: 'Total Clients',
      value: fmt(data?.clients.total),
      sub: isLoading ? '—' : `${data?.clients.active ?? 0} active`,
      iconBg: 'bg-brand-50 text-brand-500',
      sparkColor: '#059669',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      path: '/clients',
    },
    {
      label: 'Total Contacts',
      value: fmt(data?.contacts.total),
      sub: 'Across all clients',
      iconBg: 'bg-violet-50 text-violet-500',
      sparkColor: '#8b5cf6',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      path: '/contacts',
    },
    {
      label: 'Total Tasks',
      value: fmt(data?.tasks.total),
      sub: isLoading ? '—' : `${data?.tasks.by_status.completed ?? 0} completed`,
      iconBg: 'bg-amber-50 text-amber-600',
      sparkColor: '#D97706',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      path: '/tasks',
    },
    {
      label: 'Notifications',
      value: fmt(data?.notifications.unread_count),
      sub: data?.notifications.unread_count ? `${data.notifications.unread_count} unread` : 'No unread alerts',
      iconBg: 'bg-blue-50 text-blue-500',
      sparkColor: '#3b82f6',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      path: '/notifications',
    },
    {
      label: 'Total Invoices',
      value: fmt(data?.invoices.total),
      sub: isLoading ? '—' : `${data?.invoices.overdue ?? 0} overdue`,
      iconBg: 'bg-red-50 text-red-500',
      sparkColor: '#DC2626',
      icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      path: '/invoices',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {stats.map((s) => (
        <Link
          key={s.label}
          to={s.path}
          className="group bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.iconBg}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d={s.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-16 h-8 opacity-50" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0,30 Q25,28 50,30 T100,30" fill="none" stroke={s.sparkColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
          <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight">{s.value}</h3>
          <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">{s.sub}</p>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Task Pipeline
// ─────────────────────────────────────────────────────────────────
const TASK_STAGES = [
  { label: 'New',             key: 'new'            as const, color: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
  { label: 'In Progress',     key: 'in_progress'    as const, color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  { label: 'Awaiting Client', key: 'waiting_client' as const, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' },
  { label: 'In Review',       key: 'review'         as const, color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' },
  { label: 'Completed',       key: 'completed'      as const, color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
];

function TaskPipeline({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  const counts = TASK_STAGES.map(s => data?.tasks.by_status[s.key] ?? 0);
  const total = data?.tasks.total ?? 0;

  const barOptions: ApexOptions = {
    chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false }, animations: { enabled: true } },
    colors: TASK_STAGES.map(s => s.color),
    plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: '#f1f5f9', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    xaxis: {
      categories: TASK_STAGES.map(s => s.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '11px', fontWeight: '600', colors: '#94a3b8' } },
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      labels: { style: { fontSize: '11px', fontWeight: '600', colors: '#94a3b8' } },
    },
    tooltip: { y: { formatter: (v) => `${v} tasks` } },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-white">Task Pipeline</h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
              {isLoading ? '—' : total.toLocaleString()} total tasks across all stages
            </p>
          </div>
          <Link to="/tasks" className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">View All</Link>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {TASK_STAGES.map((s, i) => (
            <div key={s.key} className={`rounded-xl p-3 text-center ${s.bg}`}>
              <p className="text-xl font-extrabold">{isLoading ? '—' : counts[i]}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-[#111827] dark:text-white">Tasks by Stage</p>
          <span className="text-xs text-slate-400 dark:text-gray-500">Current</span>
        </div>
        <div className="w-full overflow-x-auto">
          <Chart
            options={barOptions}
            series={[{ name: 'Tasks', data: counts }]}
            type="bar"
            height={200}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Invoice Summary
// ─────────────────────────────────────────────────────────────────
const INVOICE_ROWS = [
  { label: 'Draft',   key: 'draft'   as const, color: '#818cf8', dot: 'bg-[#818cf8]' },
  { label: 'Sent',    key: 'sent'    as const, color: '#38bdf8', dot: 'bg-[#38bdf8]' },
  { label: 'Paid',    key: 'paid'    as const, color: '#34d399', dot: 'bg-[#34d399]' },
  { label: 'Overdue', key: 'overdue' as const, color: '#fb7185', dot: 'bg-[#fb7185]' },
];

function InvoiceSummary({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  const counts = INVOICE_ROWS.map(r => data?.invoices[r.key] ?? 0);
  const total = data?.invoices.total ?? 0;
  const outstanding = data?.invoices.total_outstanding_amount
    ? `$${parseFloat(data.invoices.total_outstanding_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';

  // Use 1 as placeholder so donut renders when all zeros
  const series = counts.map(c => (c === 0 ? 1 : c));

  const donutOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
    colors: INVOICE_ROWS.map(r => r.color),
    labels: INVOICE_ROWS.map(r => r.label),
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '11px',
              fontWeight: '700',
              color: '#94a3b8',
              formatter: () => (isLoading ? '—' : total.toString()),
            },
            value: { show: false },
          },
        },
      },
    },
    stroke: { width: 2, colors: ['#fff'] },
    states: { hover: { filter: { type: 'lighten' } }, active: { filter: { type: 'none' } } },
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
      style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' },
      y: { formatter: (_v, opts) => `${counts[opts?.seriesIndex ?? 0]} invoices` },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Invoice Summary</h2>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Billing status overview</p>
        </div>
        <Link to="/invoices/new" className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">New Invoice</Link>
      </div>

      <div className="flex justify-center mb-4">
        <div className="w-full max-w-[200px]">
          <Chart options={donutOptions} series={series} type="donut" height={200} />
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {INVOICE_ROWS.map((r, i) => (
          <div key={r.key} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
              <span className="text-sm text-slate-600 dark:text-gray-400">{r.label}</span>
            </div>
            <span className="text-sm font-bold text-[#111827] dark:text-white">
              {isLoading ? '—' : counts[i]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
          <p className="text-lg font-extrabold text-[#DC2626]">{isLoading ? '—' : outstanding}</p>
        </div>
        <Link to="/invoices" className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1">
          View All
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Recent Activity (static shell — no activity API yet)
// ─────────────────────────────────────────────────────────────────
function RecentActivity() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Recent Activity</h2>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Latest updates across your workspace</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idle</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-300 dark:text-gray-600">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-gray-500">No activity yet</p>
        <p className="text-xs text-slate-300 dark:text-gray-600 mt-1 max-w-[200px]">
          Activity will appear here once you start adding clients, tasks, and invoices.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Client Table
// ─────────────────────────────────────────────────────────────────
function ClientTable({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  const navigate = useNavigate();
  const total = data?.clients.total ?? 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/30 dark:bg-gray-800/20">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Client Overview</h2>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">All clients with task and invoice status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/clients/new')}
            className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest border-b border-slate-50 dark:border-gray-800 bg-slate-50/20 dark:bg-gray-800/10">
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Open Tasks</th>
              <th className="px-6 py-4">Invoices</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : total === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300 dark:text-gray-600">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-400 dark:text-gray-500">No clients yet</p>
                    <p className="text-xs text-slate-300 dark:text-gray-600">Add your first client to get started</p>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center">
                  <Link to="/clients" className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                    View all {total.toLocaleString()} clients →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-gray-800/20 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">
          {isLoading ? '—' : `${total.toLocaleString()} clients total`}
        </p>
        <Link to="/clients" className="text-xs font-bold text-brand-500 hover:text-brand-600 hover:underline transition-all">
          View All Clients
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────────
function defaultRange(): DateRange {
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start, end };
}

function parseRangeFromParams(params: URLSearchParams): DateRange | null {
  const startStr = params.get('start');
  const endStr   = params.get('end');
  if (!startStr || !endStr) return null;
  // Validate YYYY-MM-DD format
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(startStr) || !iso.test(endStr)) return null;
  const start = new Date(`${startStr}T00:00:00`);
  const end   = new Date(`${endStr}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return null;
  return { start, end };
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    return parseRangeFromParams(searchParams) ?? defaultRange();
  });

  function setDateRange(range: DateRange) {
    setDateRangeState(range);
    setSearchParams({ start: toYMD(range.start), end: toYMD(range.end) }, { replace: true });
  }

  const { data, isLoading, isError } = useDashboardSummary(dateRange);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">Welcome to Taxmic. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3 items-center">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => navigate('/clients/new')}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-sm flex items-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Record
          </button>
        </div>
      </div>

      {isError && (
        <Alert
          variant="error"
          title="Failed to load dashboard"
          message="Could not fetch dashboard data. Please try again."
        />
      )}

      {/* Row 1: KPI metrics */}
      <KPIBar data={data} isLoading={isLoading} />

      {/* Row 2: Task pipeline (2/3) + Invoice summary (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TaskPipeline data={data} isLoading={isLoading} />
        </div>
        <div>
          <InvoiceSummary data={data} isLoading={isLoading} />
        </div>
      </div>

      {/* Row 3: Client table (2/3) + Activity feed (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ClientTable data={data} isLoading={isLoading} />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>


    </div>
  );
}
