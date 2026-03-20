export default function FinancialPulse() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-[#111827] tracking-tight">Financial Pulse</h2>
          <p className="text-xs text-slate-400">October Revenue Cycle</p>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover-lift">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {/* Gross Invoiced */}
        <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:border-brand-500/20 transition-all hover-lift">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Gross Invoiced</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-extrabold text-[#111827] tracking-tight">$45,200</h4>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-100">42 Issued</span>
          </div>
        </div>

        {/* Net Collections */}
        <div className="p-5 rounded-2xl bg-brand-50/40 border border-brand-100 group hover:bg-brand-50/60 transition-all hover-lift">
          <p className="text-[10px] font-bold text-brand-600 uppercase mb-2 tracking-widest">Net Collections</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-extrabold text-brand-700 tracking-tight">$26,800</h4>
            <div className="text-right">
              <p className="text-[10px] font-bold text-brand-600">59% Rate</p>
              <div className="w-16 h-1.5 bg-brand-100 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-brand-400 h-full rounded-full" style={{ width: "59%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Due / Overdue grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-slate-100 rounded-2xl bg-white hover-lift">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-widest">Due &lt;30d</p>
            <p className="text-lg font-extrabold text-[#111827] tracking-tight">$12.4K</p>
          </div>
          <div className="p-4 border border-[#DC2626]/20 bg-[#DC2626]/5 rounded-2xl hover-lift">
            <p className="text-[10px] text-[#DC2626] font-bold uppercase mb-1 tracking-widest">Overdue 30d+</p>
            <p className="text-lg font-extrabold text-[#DC2626] tracking-tight">$6.0K</p>
          </div>
        </div>
      </div>

      <button className="mt-8 text-xs font-bold text-brand-500 flex items-center justify-center gap-2 hover:text-brand-600 hover:translate-x-1 transition-all group">
        Detailed Billing Analysis
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
