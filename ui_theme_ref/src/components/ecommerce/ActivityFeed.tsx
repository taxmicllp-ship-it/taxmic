const activities = [
  {
    iconBg: "bg-brand-50 text-brand-500 border border-brand-100",
    icon: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    title: "Document Upload:",
    titleLink: "Global Dynamics",
    titleLinkColor: "text-brand-500 cursor-pointer hover:underline",
    desc: <>Alex R. uploaded <span className="italic text-slate-600 font-medium">"FY24_Strategic_Plan.pdf"</span> to shared vault.</>,
    time: "12m ago",
  },
  {
    iconBg: "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Revenue Event:",
    titleLink: "$5,400 Received",
    titleLinkColor: "text-[#16A34A] font-bold",
    desc: <>Invoice <span className="font-medium text-slate-600">#INV-4521</span> Zenith Corp reconciled by system.</>,
    time: "45m ago",
  },
  {
    iconBg: "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    title: "Workflow Milestone Updated",
    titleLink: null,
    titleLinkColor: "",
    desc: <>Sarah Miller updated <span className="font-medium text-slate-600">Estate Planning</span> to <span className="text-[#D97706] font-semibold italic">Awaiting Partner Review</span>.</>,
    time: "2h ago",
  },
  {
    iconBg: "bg-brand-50 text-brand-600 border border-brand-100",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    title: "New Strategic Partnership",
    titleLink: null,
    titleLinkColor: "",
    desc: "Pacific Ventures signed their engagement letter. Onboarding sequence triggered.",
    time: "5h ago",
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-[#111827] tracking-tight">Firm Activity Feed</h2>
          <p className="text-xs text-slate-400">Real-time collaboration across all teams</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-lg border border-brand-100">
          <div className="w-2 h-2 rounded-full bg-brand-500 live-pulse" />
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Live Stream</span>
        </div>
      </div>

      <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
        {activities.map((a, i) => (
          <div key={i} className="relative pl-12 group">
            <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 group-hover:scale-110 transition-transform ${a.iconBg}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d={a.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#111827]">
                  {a.title}{" "}
                  {a.titleLink && <span className={a.titleLinkColor}>{a.titleLink}</span>}
                </p>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{a.time}</span>
              </div>
              <p className="text-xs text-slate-400">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
