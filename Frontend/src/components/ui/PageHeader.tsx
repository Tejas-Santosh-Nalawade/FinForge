import { Bell, User } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  company?: string | null;
  period?: string | null;
  currency?: string | null;
  notifications?: number;
  userName?: string;
  userRole?: string;
}

export function PageHeader({
  title,
  description,
  company = '—',
  period = '—',
  currency = 'USD',
  notifications = 0,
  userName = 'User',
  userRole = 'Analyst',
}: PageHeaderProps) {
  const displayCompany = company || '—';
  const displayPeriod = period || '—';
  const displayCurrency = currency || 'USD';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-border-subtle shadow-subtle">
          <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Entity:</span>
          <span className="text-xs font-medium text-slate-700">{displayCompany}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-border-subtle shadow-subtle">
          <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Period:</span>
          <span className="text-xs font-medium text-slate-700">{displayPeriod}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-border-subtle shadow-subtle">
          <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Cur:</span>
          <span className="text-xs font-medium text-slate-700">{displayCurrency}</span>
        </div>

        <button
          className="relative p-1.5 rounded bg-white border border-border-subtle text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-subtle"
          title="Notifications"
        >
          <Bell size={15} />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-critical text-white text-[9px] font-bold flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white border border-border-subtle shadow-subtle">
          <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-2xs font-bold">
            <User size={13} />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
            <p className="text-2xs text-slate-400 leading-tight">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
