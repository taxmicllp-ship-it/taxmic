export default function SidebarWidget() {
  return (
    <div className="mx-auto mb-8 w-full rounded-2xl overflow-hidden border border-brand-100 dark:border-brand-500/20">
      <div className="relative bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-5">
        <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-white/10" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Upgrade to Pro</h3>
          <p className="text-white/70 text-xs leading-relaxed mb-4">
            Unlock 400+ UI components and premium templates.
          </p>
          <a
            href="https://tailadmin.com/pricing"
            target="_blank"
            rel="nofollow"
            className="flex items-center justify-center py-2 font-bold text-brand-600 rounded-xl bg-white text-xs hover:bg-brand-50 transition-colors"
          >
            View Plans →
          </a>
        </div>
      </div>
    </div>
  );
}
