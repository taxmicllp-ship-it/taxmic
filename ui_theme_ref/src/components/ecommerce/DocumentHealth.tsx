export default function DocumentHealth() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col">
      <h2 className="text-lg font-bold text-[#111827] tracking-tight mb-2">Document Health</h2>
      <p className="text-xs text-slate-400 mb-8">
        Average processing: <span className="text-brand-500 font-bold">1.4 Days</span>
      </p>

      <div className="flex-1 space-y-10">
        {/* Stage 01 */}
        <div className="relative">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stage 01</p>
              <p className="text-sm font-semibold text-slate-700">Awaiting Client</p>
            </div>
            <p className="text-sm font-bold text-[#111827]">8 <span className="text-[10px] font-medium text-slate-400">files</span></p>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 rounded-full" style={{ width: "30%" }} />
          </div>
        </div>

        {/* Stage 02 */}
        <div className="relative">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest">Stage 02</p>
              <p className="text-sm font-semibold text-slate-700">Partially Completed</p>
            </div>
            <p className="text-sm font-bold text-[#111827]">12 <span className="text-[10px] font-medium text-slate-400">files</span></p>
          </div>
          <div className="h-2 w-full bg-[#D97706]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#D97706] rounded-full" style={{ width: "65%" }} />
          </div>
        </div>

        {/* Stage 03 */}
        <div className="relative">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Stage 03</p>
              <p className="text-sm font-semibold text-slate-700">Partner Verified</p>
            </div>
            <p className="text-sm font-bold text-[#111827]">25 <span className="text-[10px] font-medium text-slate-400">files</span></p>
          </div>
          <div className="h-2 w-full bg-brand-50 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full doc-health-glow" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-500/5 rounded-xl p-3 text-center border border-brand-500/10 hover-lift">
            <p className="text-[10px] font-bold text-brand-500 uppercase">Response</p>
            <p className="text-lg font-extrabold text-brand-500">-8% <span className="text-[10px] font-normal">v/s lw</span></p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 hover-lift">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Backlog</p>
            <p className="text-lg font-extrabold text-slate-700">15%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
