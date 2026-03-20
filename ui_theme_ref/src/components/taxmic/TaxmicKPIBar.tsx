const stats = [
  {
    label: "Total Clients",
    value: "0",
    sub: "Active client accounts",
    iconBg: "bg-brand-50 text-brand-500",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    sparkPath: "M0,30 Q25,28 50,30 T100,30",
    sparkColor: "#059669",
  },
  {
    label: "Total Contacts",
    value: "0",
    sub: "Across all clients",
    iconBg: "bg-violet-50 text-violet-500",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    sparkPath: "M0,30 Q25,28 50,30 T100,30",
    sparkColor: "#8b5cf6",
  },
  {
    label: "Total Tasks",
    value: "0",
    sub: "0 completed",
    iconBg: "bg-[#D97706]/10 text-[#D97706]",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    sparkPath: "M0,30 Q25,28 50,30 T100,30",
    sparkColor: "#D97706",
  },
  {
    label: "Notifications",
    value: "0",
    sub: "No unread alerts",
    iconBg: "bg-blue-50 text-blue-500",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    sparkPath: "M0,30 Q25,28 50,30 T100,30",
    sparkColor: "#3b82f6",
  },
  {
    label: "Total Invoices",
    value: "0",
    sub: "0 outstanding",
    iconBg: "bg-[#DC2626]/10 text-[#DC2626]",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
    sparkPath: "M0,30 Q25,28 50,30 T100,30",
    sparkColor: "#DC2626",
  },
];

export default function TaxmicKPIBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="group bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5 shadow-soft hover-lift stat-card-glow cursor-default"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${s.iconBg}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d={s.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-16 h-8 opacity-60" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d={s.sparkPath} fill="none" stroke={s.sparkColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
          <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight">{s.value}</h3>
          <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
