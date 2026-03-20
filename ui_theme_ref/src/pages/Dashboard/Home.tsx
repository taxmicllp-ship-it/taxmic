import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import ActiveWorkflows from "../../components/ecommerce/ActiveWorkflows";
import DocumentHealth from "../../components/ecommerce/DocumentHealth";
import FinancialPulse from "../../components/ecommerce/FinancialPulse";
import ActivityFeed from "../../components/ecommerce/ActivityFeed";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Firm Overview | TailAdmin"
        description="TailAdmin React Tailwind CSS Admin Dashboard"
      />

      <div className="space-y-8">
        {/* Alert Banner */}
        <div className="bg-[#DC2626]/5 border border-[#DC2626]/15 p-4 rounded-2xl flex items-center justify-between shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Critical Action Required</p>
              <p className="text-xs text-slate-500">3 overdue compliance tasks and 5 high-priority document requests need attention.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="text-xs font-semibold text-slate-400 hover:text-slate-900 px-4 py-2 transition-colors">Dismiss</button>
            <button className="text-xs font-bold bg-white text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/5 px-5 py-2.5 rounded-xl shadow-sm hover-lift">
              Resolve Now
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Firm Overview</h2>
            <p className="text-slate-500 text-sm mt-0.5">Operational status and performance metrics.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm hover-lift ring-brand-500/5 hover:ring-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-brand-500">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Oct 21, 2023
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-premium flex items-center gap-2 hover-lift">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Record
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <EcommerceMetrics />

        {/* Row 2: Active Workflows + Document Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ActiveWorkflows />
          </div>
          <div>
            <DocumentHealth />
          </div>
        </div>

        {/* Row 3: Financial Pulse + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <FinancialPulse />
          </div>
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
        </div>

        {/* Key Account Portfolio */}
        <RecentOrders />
      </div>
    </>
  );
}
