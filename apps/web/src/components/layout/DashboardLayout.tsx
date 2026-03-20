import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import { removeToken, getRole, getTokenPayload, isAuthenticated } from '../../lib/auth';
import { useUnreadNotificationCount } from '../../features/notifications/hooks/useUnreadNotificationCount';
import { useNotifications, useMarkAsRead } from '../../features/notifications/hooks/useNotifications';
import type { Notification } from '../../features/notifications/types';

// ── SVG Icon helper ──────────────────────────────────────────────
function Icon({ path, size = 16, className = '' }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  dashboard: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 3.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z',
  clients:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  contacts:  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  tasks:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  documents: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  invoices:  'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  billing:   'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  plans:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M12 16h.01',
  notifications: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  management:'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  chevronDown: 'M6 9l6 6 6-6',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  signout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  settings:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  support:   'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  close:     'M6 18L18 6M6 6l12 12',
  menu:      'M4 6h16M4 12h16M4 18h10',
  arrowRight:'M5 12h14M12 5l7 7-7 7',
};

// ── Mega menu items ──────────────────────────────────────────────
const MEGA_LEFT = [
  { label: 'Client Directory', subtitle: 'Manage all firm clients',    icon: ICONS.clients,   path: '/clients' },
  { label: 'Contacts',         subtitle: 'People across your clients', icon: ICONS.contacts,  path: '/contacts' },
  { label: 'Task Board',       subtitle: 'Workflow and assignments',   icon: ICONS.tasks,     path: '/tasks' },
];

const MEGA_RIGHT_BASE = [
  { label: 'Invoicing',  subtitle: 'Billing and collections',    icon: ICONS.invoices,  path: '/invoices' },
  { label: 'Documents',  subtitle: 'Client portal uploads',      icon: ICONS.documents, path: '/documents' },
  { label: 'Billing',    subtitle: 'Subscription & payments',    icon: ICONS.billing,   path: '/billing/subscription' },
];

const MEGA_RIGHT_ADMIN = [
  ...MEGA_RIGHT_BASE,
  { label: 'Plans',      subtitle: 'Manage pricing plans',       icon: ICONS.plans,     path: '/billing/admin/plans' },
];

// ── Notification icon by type ────────────────────────────────────
function notifIconPath(type: Notification['type']): string {
  switch (type) {
    case 'document_uploaded': return ICONS.documents;
    case 'invoice_paid':
    case 'invoice_sent':      return ICONS.invoices;
    case 'task_assigned':
    case 'task_completed':    return ICONS.tasks;
    case 'user_invited':      return ICONS.contacts;
    default:                  return ICONS.bell;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Search bar (UI placeholder — full search is a future feature) ──
function SearchBar() {
  return (
    <div className="hidden sm:flex items-center relative mr-2">
      <Icon path={ICONS.search} size={16} className="absolute left-3 text-slate-400 pointer-events-none z-10" />
      <input
        type="text"
        placeholder="Search anything..."
        readOnly
        className="pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm text-slate-900 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 w-48 focus:outline-none cursor-default"
      />
    </div>
  );
}

// ── Notification dropdown ────────────────────────────────────────
function NotificationDropdown({ unreadCount }: { unreadCount?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications({ limit: 5, is_read: false });
  const { mutate: markAsRead } = useMarkAsRead();
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = data?.data ?? [];
  const hasUnread = unreadCount && unreadCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
      >
        <Icon path={ICONS.bell} size={20} />
        {hasUnread ? (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 px-1 leading-none">
            {unreadCount! > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 px-1 leading-none">
            0
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.03),0_10px_10px_-5px_rgba(0,0,0,0.02)] z-[60] overflow-hidden animate-[slideDown_0.3s_ease-out_forwards]">
          {/* Header */}
          <div className="p-4 border-b border-slate-50 dark:border-gray-800 bg-slate-50/30 dark:bg-gray-800/30 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
            <button className="text-[10px] font-bold text-brand-500 hover:underline uppercase tracking-wider">
              Mark all as read
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 bg-slate-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Icon path={ICONS.bell} size={18} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">All caught up</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { markAsRead(n.id); setOpen(false); navigate('/notifications'); }}
                  className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors group w-full text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-brand-500'}`}>
                    <Icon path={notifIconPath(n.type)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors leading-tight">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] font-bold text-slate-300 dark:text-gray-600 uppercase tracking-widest mt-2">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block p-3 text-center border-t border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 text-[11px] font-bold text-slate-400 dark:text-gray-500 hover:text-brand-500 transition-all uppercase tracking-wider"
          >
            View All Activity
          </Link>
        </div>
      )}
    </div>
  );
}

// ── User dropdown ────────────────────────────────────────────────
function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const payload = getTokenPayload();
  const name = (payload?.name as string) || (payload?.email as string) || 'User';
  const role = (payload?.role as string) || 'member';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSignOut() {
    removeToken();
    navigate('/login');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 pl-1 cursor-pointer group"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{name}</p>
          <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wide capitalize">{role}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white">
          {initials}
        </div>
        <Icon path={ICONS.chevronDown} size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.03),0_10px_10px_-5px_rgba(0,0,0,0.02)] z-50 overflow-hidden animate-[slideDown_0.3s_ease-out_forwards]">
          <div className="px-4 py-3 border-b border-slate-50 dark:border-gray-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name}</p>
            <p className="text-xs text-slate-400 dark:text-gray-500 capitalize">{role}</p>
          </div>
          <div className="py-1.5">
            <Link
              to="/billing/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Icon path={ICONS.settings} size={15} className="text-slate-400" />
              Account Settings
            </Link>
            <button className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors w-full text-left">
              <Icon path={ICONS.support} size={15} className="text-slate-400" />
              Support
            </button>
          </div>
          <div className="border-t border-slate-50 dark:border-gray-800 py-1.5">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
            >
              <Icon path={ICONS.signout} size={15} className="text-red-400" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile accordion group ───────────────────────────────────────
function MobileGroup({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon path={icon} size={16} />
          {label}
        </span>
        <Icon
          path={ICONS.chevronDown}
          size={14}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="ml-4 mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

// ── Main Layout ──────────────────────────────────────────────────
export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useUnreadNotificationCount();
  const role = getRole();
  const isAdmin = role === 'admin';

  // Auth guard — redirect unauthenticated users to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const megaRight = isAdmin ? MEGA_RIGHT_ADMIN : MEGA_RIGHT_BASE;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  function navCls(path: string) {
    return `px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
      isActive(path)
        ? 'bg-brand-500/10 text-brand-500'
        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
    }`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-gray-950">
      {/* ── Navbar ── */}
      <nav className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-[99999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-10">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Taxmic</h1>
                  <p className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Bookkeeping Success</p>
                </div>
              </Link>

              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Dashboard — direct link */}
                <Link to="/dashboard" className={navCls('/dashboard')}>
                  <Icon path={ICONS.dashboard} size={16} />
                  Dashboard
                </Link>

                {/* Management — CSS hover mega menu */}
                <div className="group relative">
                  <button className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    ['/clients','/contacts','/tasks','/invoices','/documents','/billing'].some(p => location.pathname.startsWith(p))
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                    <Icon path={ICONS.management} size={16} />
                    Management
                    <Icon path={ICONS.chevronDown} size={13} className="ml-0.5" />
                  </button>

                  {/* Mega menu — hidden by default, shown on group hover via CSS */}
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 mt-2 w-[600px] bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.03),0_10px_10px_-5px_rgba(0,0,0,0.02)] animate-[slideDown_0.3s_ease-out_forwards] p-6 transition-all duration-150 z-50">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Left col — Operations */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Operations</p>
                        <div className="space-y-4">
                          {MEGA_LEFT.map(item => (
                            <Link key={item.path} to={item.path} className="flex items-start gap-3 group/item">
                              <div className="p-2 bg-emerald-50 rounded-lg text-brand-500 group-hover/item:bg-brand-500 group-hover/item:text-white transition-colors shrink-0">
                                <Icon path={item.icon} size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{item.subtitle}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Right col — Financials */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Financials</p>
                        <div className="space-y-4">
                          {megaRight.map(item => (
                            <Link key={item.path} to={item.path} className="flex items-start gap-3 group/item">
                              <div className="p-2 bg-emerald-50 rounded-lg text-brand-500 group-hover/item:bg-brand-500 group-hover/item:text-white transition-colors shrink-0">
                                <Icon path={item.icon} size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{item.subtitle}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Firm-wide reporting available in Pro.</p>
                      <Link
                        to="/billing/subscription"
                        className="text-xs font-bold text-brand-500 hover:underline"
                      >
                        View All Modules
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Activity — direct link */}
                <Link to="/notifications" className={navCls('/notifications')}>
                  <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={16} />
                  Activity
                </Link>

                {/* Settings — direct link */}
                <Link to="/settings" className={navCls('/settings')}>
                  <Icon path={ICONS.settings} size={16} />
                  Settings
                </Link>
              </div>
            </div>

            {/* Right: Search + actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <SearchBar />

              {/* Notification bell */}
              <NotificationDropdown unreadCount={unreadCount} />

              <ThemeToggleButton />

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 mx-1" />

              {/* User */}
              <UserDropdown />

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Icon path={mobileOpen ? ICONS.close : ICONS.menu} size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 space-y-1 shadow-lg">
            {/* Mobile search */}
            <div className="relative mb-3">
              <Icon path={ICONS.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-gray-500 dark:text-gray-200 focus:outline-none"
              />
            </div>

            {/* Dashboard */}
            <Link
              to="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/dashboard') ? 'bg-brand-500/10 text-brand-500' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon path={ICONS.dashboard} size={16} />
              Dashboard
            </Link>

            {/* Operations group */}
            <MobileGroup label="Operations" icon={ICONS.management}>
              {MEGA_LEFT.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(item.path) ? 'bg-brand-500/10 text-brand-500' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon path={item.icon} size={15} />
                  {item.label}
                </Link>
              ))}
            </MobileGroup>

            {/* Financials group */}
            <MobileGroup label="Financials" icon={ICONS.billing}>
              {megaRight.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(item.path) ? 'bg-brand-500/10 text-brand-500' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon path={item.icon} size={15} />
                  {item.label}
                </Link>
              ))}
            </MobileGroup>

            {/* Activity */}
            <Link
              to="/notifications"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/notifications') ? 'bg-brand-500/10 text-brand-500' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={16} />
              Activity
            </Link>

            {/* Settings */}
            <Link
              to="/settings"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/settings') ? 'bg-brand-500/10 text-brand-500' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon path={ICONS.settings} size={16} />
              Settings
            </Link>
          </div>
        )}
      </nav>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
