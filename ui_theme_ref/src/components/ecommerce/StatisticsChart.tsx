import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const perfMetrics = [
  {
    label: "Bounce Rate",
    value: "24.8%",
    trend: "+2.1% from yesterday",
    up: false,
    sparkPath: "M0,35 Q20,30 40,32 T70,10 T100,15",
    sparkColor: "#ef4444",
  },
  {
    label: "Avg. Session",
    value: "08:42",
    trend: "+12% from last week",
    up: true,
    sparkPath: "M0,25 Q30,20 50,30 T80,10 T100,5",
    sparkColor: "#10b981",
  },
  {
    label: "Load Time",
    value: "1.2s",
    trend: "-0.4s improvement",
    up: true,
    sparkPath: "M0,10 Q25,15 50,12 T75,25 T100,20",
    sparkColor: "#10b981",
  },
];

const vitals = [
  { label: "LCP", value: "0.8s", pct: 92, color: "bg-emerald-500" },
  { label: "FID", value: "12ms", pct: 96, color: "bg-emerald-500" },
  { label: "CLS", value: "0.02", pct: 98, color: "bg-emerald-500" },
];

export default function StatisticsChart() {
  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#5048e5", "#a5b4fc"],
    chart: {
      fontFamily: "Inter, sans-serif",
      height: 280,
      type: "area",
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: [2, 2] },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0 },
    },
    markers: { size: 0, hover: { size: 5 } },
    grid: {
      borderColor: "#f1f5f9",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", fontWeight: "700", colors: "#94a3b8" } },
    },
    yaxis: {
      labels: { style: { fontSize: "11px", fontWeight: "700", colors: "#94a3b8" } },
    },
    tooltip: { shared: true, intersect: false },
  };

  const series = [
    { name: "Sales", data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235] },
    { name: "Revenue", data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140] },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Real-time performance metrics */}
      <div className="p-6 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Real-time Performance</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live Metrics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perfMetrics.map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-3">{m.label}</p>
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{m.value}</h4>
                <svg className="w-16 h-8" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d={m.sparkPath} fill="none" stroke={m.sparkColor} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${m.up ? "text-emerald-500" : "text-red-500"}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  {m.up
                    ? <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M7 7l10 10M17 17H7M17 17V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  }
                </svg>
                {m.trend}
              </p>
            </div>
          ))}
        </div>

        {/* Core Web Vitals */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Core Web Vitals</p>
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Overall Score: 98/100</span>
          </div>
          <div className="space-y-3">
            {vitals.map((v) => (
              <div key={v.label} className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 w-8">{v.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${v.color} rounded-full`} style={{ width: `${v.pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white w-10 text-right">{v.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics chart */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales & Revenue</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Monthly performance overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-200" />
              <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">Revenue</span>
            </div>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px]">
            <Chart options={options} series={series} type="area" height={280} />
          </div>
        </div>
      </div>
    </div>
  );
}
