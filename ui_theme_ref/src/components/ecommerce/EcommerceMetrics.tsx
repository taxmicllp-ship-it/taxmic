// Taxmic brand palette: primary #059669, accent #34D399, warning #D97706, error #DC2626
const stats = [
  {
    label: "Active Clients",
    value: "124",
    badge: { text: "+12%", cls: "text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center gap-1" },
    badgeIcon: "M7 17L17 7M17 7H7M17 7v10",
    iconBg: "bg-brand-50 text-brand-500 group-hover:bg-brand-500 group-hover:text-white",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    label: "Pending Tasks",
    value: "42",
    badge: { text: "8 High", cls: "text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center gap-1" },
    badgeIcon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    iconBg: "bg-[#DC2626]/10 text-[#DC2626] group-hover:bg-[#DC2626] group-hover:text-white",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h.01M9 16h.01",
  },
  {
    label: "Unpaid Value",
    value: "$18.4K",
    badge: { text: "12 Invoices", cls: "text-slate-400 bg-slate-50 border border-slate-100" },
    badgeIcon: null,
    iconBg: "bg-[#D97706]/10 text-[#D97706] group-hover:bg-[#D97706] group-hover:text-white",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    label: "Doc Requests",
    value: "28",
    badge: { text: "15 Completed", cls: "text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center gap-1" },
    badgeIcon: "M5 13l4 4L19 7",
    iconBg: "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white",
    icon: "M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z",
  },
];

export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-soft hover-lift stat-card-glow cursor-default"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${stat.iconBg}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d={stat.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stat.badge.cls}`}>
              {stat.badgeIcon && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d={stat.badgeIcon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {stat.badge.text}
            </span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
