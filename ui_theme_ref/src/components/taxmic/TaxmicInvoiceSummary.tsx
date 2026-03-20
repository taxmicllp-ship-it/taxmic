import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const invoiceRows = [
  { label: "Draft",   count: 0, color: "#818cf8", dot: "bg-[#818cf8]" },
  { label: "Sent",    count: 0, color: "#38bdf8", dot: "bg-[#38bdf8]" },
  { label: "Paid",    count: 0, color: "#34d399", dot: "bg-[#34d399]" },
  { label: "Overdue", count: 0, color: "#fb7185", dot: "bg-[#fb7185]" },
];

const options: ApexOptions = {
  chart: {
    type: "donut",
    fontFamily: "Inter, sans-serif",
  },
  colors: invoiceRows.map((r) => r.color),
  labels: invoiceRows.map((r) => r.label),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: "72%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Total",
            fontSize: "11px",
            fontWeight: "700",
            color: "#94a3b8",
            formatter: () => "0",
          },
          value: { show: false },
        },
      },
    },
  },
  stroke: { width: 2, colors: ["#fff"] },
  states: {
    hover: { filter: { type: "lighten", value: 0.1 } },
    active: { filter: { type: "none" } },
  },
  tooltip: {
    theme: "light",
    fillSeriesColor: false,
    style: { fontSize: "12px", fontFamily: "Inter, sans-serif" },
    y: { formatter: (val) => `${val} invoices` },
  },
};

const series = invoiceRows.map((r) => (r.count === 0 ? 1 : r.count));

export default function TaxmicInvoiceSummary() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-6 shadow-soft flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Invoice Summary</h2>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Billing status overview</p>
        </div>
        <button className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">New Invoice</button>
      </div>

      {/* Donut */}
      <div className="flex justify-center mb-4">
        <div id="chartTwo" className="w-full max-w-[200px]">
          <Chart options={options} series={series} type="donut" height={200} />
        </div>
      </div>

      {/* Legend rows */}
      <div className="space-y-3 flex-1">
        {invoiceRows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
              <span className="text-sm text-slate-600 dark:text-gray-400">{r.label}</span>
            </div>
            <span className="text-sm font-bold text-[#111827] dark:text-white">{r.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
          <p className="text-lg font-extrabold text-[#DC2626]">$0.00</p>
        </div>
        <button className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1">
          View All
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
