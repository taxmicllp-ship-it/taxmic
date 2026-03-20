import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-950 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-950 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 lg:grid overflow-hidden">
          <div className="relative flex items-center justify-center z-1">
            <div className="relative flex flex-col items-center max-w-xs text-center">
              <Link to="/" className="block mb-6">
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-white tracking-tight">Taxmic</span>
                </div>
              </Link>
              <h2 className="text-white font-semibold text-xl mb-3">Less Chaos. More Accounting.</h2>
              <p className="text-brand-200/70 dark:text-white/50 text-sm leading-relaxed">
                The simplest practice management system for bookkeepers and accounting firms.
              </p>
              <div className="flex gap-3 mt-8">
                {['Clients', 'Invoicing', 'Tasks'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
