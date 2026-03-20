import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const stages = [
  { label: "New", count: 0, color: "#94a3b8", bg: "bg-slate-100 text-slate-500", icon: "M12 4v16m8-8H4" },
  { label: "In Progress", count: 0, color: "#D97706", bg: "bg-[#D97706]/10 text-[#D97706]", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { label: "Awaiting Client", count: 0, color: "#3b82f6", bg: "bg-blue-50 text-blue-500", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "In Review", count: 0, color: "#8b5cf6", bg: "bg-purple-50 text-purple-500", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Completed", count: 0, color: "#059669", bg: "bg-brand-50 text-brand-600", icon: "M5 13l4 4L19 7" },
];

const options: ApexOptions = {
  chart: {
    type: "bar",
    fontFamily: "Inter, sans-serif",
    toolbar: { show: false },
    sparkline: { enabled: false },
  },
  colors: stages.map((s) => s.color),
  plotOptions: {
    bar: {
      distributed: true,
      borderRadius: 6,
      columnWidth: "55%",
    },
  },
  dataLabels: { enabled: false },
  legend: { show: false },
  grid: {
    borderColor: "#f1f5f9",
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
  },
  xaxis: {
    categories: stages.map((s) => s.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: { fontSize: "11px", fontWeight: "600", colors: "#94a3b8" },
    },
  },
  yaxis: {
    min: 0,
    max: 10,
    tickAmount: 5,
    labels: { style: { fontSize: "11px", fontWeight: "600", colors: "#94a3b8" } },
  },
  tooltip: {
    y: { formatter: (val) => `${val} tasks` },
  },
};

const series = [{ name: "Tasks", data: stages.map((s) => s.count) }];

export default function TaxmicTaskPipeline() {
  const total = stages.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-soft overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-white">Task Pipeline</h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{total} total tasks across all stages</p>
          </div>
          <button className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors">View All</button>
        </div>

        {/* Stage summary row */}
        <div className="grid grid-cols-5 gap-3">
          {stages.map((s) => (
            <div key={s.label} className={`rounded-xl p-3 text-center ${s.bg} bg-opacity-60`}>
              <p className="text-xl font-extrabold">{s.count}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-[#111827] dark:text-white">Tasks by Stage</p>
          <span className="text-xs text-slate-400 dark:text-gray-500">This month</span>
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[400px]">
            <Chart options={options} series={series} type="bar" height={200} />
          </div>
        </div>
      </div>
    </div>
  );
}
