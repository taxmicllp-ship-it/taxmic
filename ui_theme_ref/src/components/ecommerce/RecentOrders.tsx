import { useState, useRef, useEffect } from "react";

const accounts = [
  {
    initials: "GD",
    initialsColor: "bg-brand-50 text-brand-600 border border-brand-100",
    client: "Global Dynamics Inc.",
    sector: "Technology Sector",
    ownerInitials: "AR",
    ownerInitialsColor: "bg-brand-500/10 text-brand-600",
    owner: "Alex Rivers",
    contract: "$125,000",
    compliance: "Active",
    complianceColor: "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20",
    health: 92,
    healthColor: "bg-brand-500",
  },
  {
    initials: "PV",
    initialsColor: "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20",
    client: "Pacific Ventures",
    sector: "Private Equity",
    ownerInitials: "SM",
    ownerInitialsColor: "bg-brand-50 text-brand-600",
    owner: "Sarah Miller",
    contract: "$84,500",
    compliance: "Audit",
    complianceColor: "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20",
    health: 78,
    healthColor: "bg-brand-400",
  },
  {
    initials: "SA",
    initialsColor: "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20",
    client: "Starlight Analytics",
    sector: "Data Services",
    ownerInitials: "SM",
    ownerInitialsColor: "bg-brand-50 text-brand-600",
    owner: "Sarah Miller",
    contract: "$58,200",
    compliance: "Action Req",
    complianceColor: "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20",
    health: 32,
    healthColor: "bg-[#DC2626]",
  },
];

export default function RecentOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"revenue" | "health">("revenue");
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenActionMenu(null);
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Active", label: "Active Only" },
    { value: "Audit", label: "Audit Required" },
    { value: "Action Req", label: "Action Required" },
  ];

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      a.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || a.compliance === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div ref={containerRef} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-premium">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
        <div>
          <h2 className="text-lg font-bold text-[#111827] tracking-tight">Key Account Portfolio</h2>
          <p className="text-xs text-slate-400 mt-0.5">Top revenue contributors by annual contract value</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 w-40 transition-all"
            />
          </div>

          {/* Revenue / Health tabs */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("revenue")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeTab === "revenue" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeTab === "health" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Health
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M6 12h12M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {filterStatus !== "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterStatus(opt.value); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      filterStatus === opt.value
                        ? "bg-brand-50 text-brand-600 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/20">
              <th className="px-6 py-4">Client / Organization</th>
              <th className="px-6 py-4">Relationship Owner</th>
              <th className={`px-6 py-4 transition-opacity ${activeTab === "health" ? "opacity-40" : ""}`}>Contract Value</th>
              <th className="px-6 py-4">Compliance Status</th>
              <th className={`px-6 py-4 transition-opacity ${activeTab === "revenue" ? "opacity-40" : ""}`}>Health Score</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No accounts match your filters.</td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr key={a.client} className="hover:bg-brand-50/20 transition-colors group cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] ${a.initialsColor}`}>
                        {a.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827] group-hover:text-brand-600 transition-colors">{a.client}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{a.sector}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full text-[8px] flex items-center justify-center font-bold ${a.ownerInitialsColor}`}>
                        {a.ownerInitials}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{a.owner}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-5 text-sm font-extrabold text-brand-600 transition-opacity ${activeTab === "health" ? "opacity-40" : ""}`}>
                    {a.contract}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${a.complianceColor}`}>
                      {a.compliance}
                    </span>
                  </td>
                  <td className={`px-6 py-5 transition-opacity ${activeTab === "revenue" ? "opacity-40" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${a.healthColor} rounded-full`} style={{ width: `${a.health}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#111827]">{a.health}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center relative">
                    <button
                      onClick={() => setOpenActionMenu(openActionMenu === i ? null : i)}
                      className="p-2 text-slate-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                      </svg>
                    </button>
                    {openActionMenu === i && (
                      <div className="absolute right-4 top-full mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                        <button className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">View</button>
                        <button className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Edit</button>
                        <button className="w-full text-left px-4 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#DC2626]/5 transition-colors">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Showing top 6 accounts of 124</p>
        <button className="text-xs font-bold text-brand-500 hover:text-brand-600 hover:underline transition-all">View Portfolio Details</button>
      </div>
    </div>
  );
}
