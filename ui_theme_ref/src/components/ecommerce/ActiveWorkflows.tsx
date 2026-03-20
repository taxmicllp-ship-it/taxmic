const workflows = [
  {
    title: "Q3 Tax Compliance Audit - Johnson Corp",
    meta: "Overdue 2d",
    metaIcon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    priority: "High",
    priorityColor: "text-[#DC2626] font-semibold",
    barColor: "bg-[#DC2626]",
    avatars: ["bg-slate-200", "bg-brand-500 text-white text-[10px] font-bold"],
    avatarLabel: "AR",
  },
  {
    title: "Financial Advisory Monthly Call",
    meta: "Today, 2:00 PM",
    metaIcon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    priority: "Medium",
    priorityColor: "text-[#D97706] font-semibold",
    barColor: "bg-[#D97706]",
    avatars: ["bg-slate-100 flex items-center justify-center"],
    avatarLabel: null,
  },
  {
    title: "Asset Verification - Skyline Real Estate",
    meta: "3 days left",
    metaIcon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    priority: "Low",
    priorityColor: "text-slate-400 font-semibold",
    barColor: "bg-brand-400",
    avatars: ["bg-slate-200", "bg-slate-300"],
    avatarLabel: null,
  },
];

export default function ActiveWorkflows() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-[#111827] tracking-tight">Active Workflows</h2>
          <p className="text-xs text-slate-400">Tasks requiring immediate partner review</p>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 bg-[#DC2626]/10 text-[#DC2626] text-[10px] font-bold rounded-lg border border-[#DC2626]/20 uppercase tracking-widest">3 Overdue</span>
          <span className="px-2.5 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-lg border border-brand-100 uppercase tracking-widest">12 Total</span>
        </div>
      </div>

      <div className="space-y-4">
        {workflows.map((w) => (
          <div
            key={w.title}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-brand-500/20 hover:bg-brand-50/30 transition-all group cursor-pointer"
          >
            <div className={`w-1 h-10 ${w.barColor} rounded-full shrink-0`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#111827] group-hover:text-brand-600 transition-colors">{w.title}</h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d={w.metaIcon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {w.meta}
                </span>
                <span className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                <span className={w.priorityColor}>Priority: {w.priority}</span>
              </p>
            </div>
            <div className="flex -space-x-2 shrink-0">
              {w.avatars.map((cls, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white shadow-sm ${cls}`}>
                  {i === 1 && w.avatarLabel ? w.avatarLabel : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-100 hover:border-brand-100 hover-lift">
        View Comprehensive Workflow
      </button>
    </div>
  );
}
