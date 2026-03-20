const sources = [
  { label: "Organic Search", pct: 45, color: "bg-brand-500" },
  { label: "Social Media", pct: 28, color: "bg-emerald-500" },
  { label: "Direct Link", pct: 18, color: "bg-orange-400" },
  { label: "Referrals", pct: 9, color: "bg-purple-500" },
];

export default function TrafficSources() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Traffic Sources</h2>
        <button className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">Details</button>
      </div>

      <div className="flex-1 space-y-5">
        {sources.map((s) => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-gray-400">
              <span>{s.label}</span>
              <span>{s.pct}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${s.color} rounded-full transition-all duration-700`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">Desktop</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">62%</p>
          </div>
          <div className="text-center border-l border-slate-100 dark:border-gray-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">Mobile</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">38%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
