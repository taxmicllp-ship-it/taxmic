const clients: {
  initials: string;
  initialsColor: string;
  name: string;
  sector: string;
  tasks: number;
  invoices: number;
  status: string;
  statusColor: string;
}[] = [];

export default function TaxmicClientTable() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/30 dark:bg-gray-800/20">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Client Overview</h2>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">All clients with task and invoice status</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-700 dark:text-gray-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-40 transition-all"
            />
          </div>
          <button className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors flex items-center gap-1.5">
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
            {clients.length === 0 ? (
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
              clients.map((c, i) => (
                <tr key={i} className="hover:bg-brand-50/20 dark:hover:bg-brand-500/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] ${c.initialsColor}`}>
                        {c.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827] dark:text-white group-hover:text-brand-600 transition-colors">{c.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-gray-500">{c.sector}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#111827] dark:text-white">{c.tasks}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#111827] dark:text-white">{c.invoices}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${c.statusColor}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1.5 text-slate-300 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-gray-800/20 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest">0 clients total</p>
        <button className="text-xs font-bold text-brand-500 hover:text-brand-600 hover:underline transition-all">View All Clients</button>
      </div>
    </div>
  );
}
