import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const taxmicNavItems = [
  {
    label: "Dashboard", path: "/taxmic",
    icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 3.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z",
  },
  {
    label: "Clients", path: "/profile",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    label: "Contacts", path: "/profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    label: "Tasks", path: "/calendar",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    label: "Documents", path: "/form-elements",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    label: "Invoices", path: "/basic-tables",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
  },
  {
    label: "Notifications", path: "/blank",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    label: "Billing", path: "/basic-tables",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
];

// ── Main Navbar ─────────────────────────────────────────────────
const AppNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 sticky top-0 z-[99999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">

          {/* ── Left: Logo + Nav ── */}
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Taxmic</h1>
                <p className="text-[10px] text-slate-400 font-medium">Less Chaos. More Accounting</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {taxmicNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    isActive(item.path) && item.path === "/taxmic"
                      ? "bg-brand-500/5 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={item.label === "Dashboard" ? "currentColor" : "none"} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right: Search + actions ── */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center relative mr-2">
              <svg className="absolute left-3 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-gray-700 w-48 transition-all focus:w-64"
              />
            </div>

            {/* Notification */}
            <NotificationDropdown />

            <ThemeToggleButton />

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 mx-2" />

            {/* User */}
            <UserDropdown />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 space-y-1 shadow-lg">
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          {taxmicNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive(item.path) && item.path === "/taxmic"
                  ? "bg-brand-500/5 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default AppNavbar;
