import PageMeta from "../../components/common/PageMeta";
import TaxmicKPIBar from "../../components/taxmic/TaxmicKPIBar";
import TaxmicTaskPipeline from "../../components/taxmic/TaxmicTaskPipeline";
import TaxmicInvoiceSummary from "../../components/taxmic/TaxmicInvoiceSummary";
import TaxmicRecentActivity from "../../components/taxmic/TaxmicRecentActivity";
import TaxmicClientTable from "../../components/taxmic/TaxmicClientTable";

export default function TaxmicDashboard() {
  return (
    <>
      <PageMeta
        title="Dashboard | Taxmic"
        description="Taxmic accounting dashboard overview"
      />

      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111827] dark:text-white tracking-tight">Dashboard</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">Welcome to Taxmic. Here's what's happening today.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm hover-lift">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-brand-500">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Today
            </button>
            <button className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-sm flex items-center gap-2 hover-lift">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Record
            </button>
          </div>
        </div>

        {/* Row 1: KPI metrics */}
        <TaxmicKPIBar />

        {/* Row 2: Task pipeline (2/3) + Invoice summary (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TaxmicTaskPipeline />
          </div>
          <div>
            <TaxmicInvoiceSummary />
          </div>
        </div>

        {/* Row 3: Client table (2/3) + Activity feed (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TaxmicClientTable />
          </div>
          <div>
            <TaxmicRecentActivity />
          </div>
        </div>
      </div>
    </>
  );
}
