import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function MonthlyTarget() {
  const series = [75.55];
  const options: ApexOptions = {
    colors: ["#5048e5"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: "radialBar",
      height: 260,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "72%" },
        track: { background: "#f1f5f9", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "32px",
            fontWeight: "700",
            offsetY: -20,
            color: "#0f172a",
            formatter: (val) => val + "%",
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#5048e5"] },
    stroke: { lineCap: "round" },
    labels: ["Progress"],
  };

  const targets = [
    { label: "Target", value: "$20K", up: false },
    { label: "Revenue", value: "$15.1K", up: true },
    { label: "Today", value: "$3.2K", up: true },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Target</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Target you've set for each month</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            +10%
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div id="chartDarkStyle" className="w-full max-h-[260px]">
          <Chart options={options} series={series} type="radialBar" height={260} />
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-gray-400 -mt-4 max-w-[260px]">
          You earn <span className="font-bold text-slate-900 dark:text-white">$3,287</span> today, higher than last month. Keep it up!
        </p>
      </div>

      <div className="border-t border-slate-100 dark:border-gray-800 grid grid-cols-3 divide-x divide-slate-100 dark:divide-gray-800">
        {targets.map((t) => (
          <div key={t.label} className="py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">{t.label}</p>
            <p className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              {t.value}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                {t.up
                  ? <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M7 7l10 10M17 17H7M17 17V7" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                }
              </svg>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
