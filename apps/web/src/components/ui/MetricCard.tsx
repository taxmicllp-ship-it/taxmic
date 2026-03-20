import { Link } from 'react-router-dom';

interface MetricCardProps {
  label: string;
  description: string;
  path: string;
  iconPath: string;
  iconBg: string;
  count?: number | null;
  value?: string;
}

export default function MetricCard({ label, description, path, iconPath, iconBg, count, value }: MetricCardProps) {
  const display = value !== undefined
    ? value
    : count != null
      ? count.toLocaleString()
      : '—';

  return (
    <Link
      to={path}
      className="group block bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${iconBg}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d={iconPath} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-slate-300 group-hover:text-brand-500 transition-colors mt-1"
        >
          <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{display}</p>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm text-slate-500 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
