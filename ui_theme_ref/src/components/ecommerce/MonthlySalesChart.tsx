import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";

export default function MonthlySalesChart() {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const weekSeries = [
    { name: "Current", data: [42, 58, 48, 72, 55, 80, 95] },
    { name: "Previous", data: [30, 45, 38, 55, 42, 60, 70] },
  ];
  const monthSeries = [
    { name: "Current", data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112] },
    { name: "Previous", data: [120, 300, 180, 250, 160, 170, 240, 90, 190, 340, 240, 95] },
  ];

  const categories = period === "week"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const options: ApexOptions = {
    colors: ["#5048e5", "#e2e8f0"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: "area",
      height: 280,
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: [3, 2],
      dashArray: [0, 5],
    },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        opacityFrom: 0.25,
        opacityTo: 0,
        stops: [0, 100],
      },
      opacity: [1, 0],
    },
    markers: {
      size: [4, 0],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: "#f1f5f9",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 0, right: 0 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "11px", fontWeight: "700", colors: "#94a3b8" },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", fontWeight: "700", colors: "#94a3b8" },
        formatter: (val) => `${val}k`,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val) => `$${val}k` },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
              LIVE
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            Comparing current {period} vs. previous {period}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-gray-600" />
              <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">Previous</span>
            </div>
          </div>
          {/* Period toggle */}
          <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === "week" ? "bg-white dark:bg-gray-700 text-brand-500 shadow-sm" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === "month" ? "bg-white dark:bg-gray-700 text-brand-500 shadow-sm" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px]">
          <Chart
            options={options}
            series={period === "week" ? weekSeries : monthSeries}
            type="area"
            height={280}
          />
        </div>
      </div>
    </div>
  );
}
