const activities: {
  iconBg: string;
  icon: string;
  title: string;
  desc: string;
  time: string;
}[] = [];

export default function TaxmicRecentActivity() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 shadow-soft h-full flex flex-col">
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

      {activities.length === 0 ? (
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
      ) : (
        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-gray-800">
          {activities.map((a, i) => (
            <div key={i} className="relative pl-12 group">
              <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 group-hover:scale-110 transition-transform ${a.iconBg}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d={a.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#111827] dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{a.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-gray-600 uppercase tracking-widest shrink-0">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
