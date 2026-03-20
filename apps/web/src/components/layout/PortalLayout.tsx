import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { usePortalAuth } from '../../features/portal/context/PortalAuthContext';

export default function PortalLayout() {
  const { portalToken, portalUser, portalLogout } = usePortalAuth();

  if (!portalToken) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Taxmic</span>
        </div>

        <div className="flex items-center gap-4">
          {portalUser && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {portalUser.firstName} {portalUser.lastName}
            </span>
          )}
          <button
            onClick={portalLogout}
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6">
        <div className="flex gap-6">
          {[
            { to: '/portal/dashboard', label: 'Dashboard' },
            { to: '/portal/documents', label: 'Documents' },
            { to: '/portal/invoices', label: 'Invoices' },
            { to: '/portal/tasks', label: 'Tasks' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
