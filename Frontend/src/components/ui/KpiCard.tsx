import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value?: string | number | null;
  change?: number | null;
  direction?: 'up' | 'down';
  suffix?: string;
  accent?: boolean;
  emptyText?: string;
}

export function KpiCard({
  label,
  value,
  change,
  direction,
  suffix,
  accent,
  emptyText = 'No data',
}: KpiCardProps) {
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = hasValue ? value : emptyText;
  const isPositive = direction === 'up';
  const isNegative = direction === 'down';
  const showChange = change !== undefined && change !== null;

  return (
    <div
      className={`card p-3.5 card-hover ${
        accent ? 'border-accent/40 bg-blue-50/20' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="kpi-label truncate">{label}</p>
          <p
            className={`text-xl font-bold mt-1.5 tracking-tight ${
              hasValue ? 'text-slate-900' : 'text-slate-400 font-medium'
            }`}
          >
            {displayValue}
          </p>
          {suffix && hasValue && (
            <p className="text-2xs text-slate-400 mt-0.5">{suffix}</p>
          )}
        </div>
        {showChange && hasValue && (
          <div
            className={`flex items-center gap-0.5 text-2xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-status-success bg-green-50 border border-green-200'
                : isNegative
                ? 'text-status-critical bg-red-50 border border-red-200'
                : 'text-slate-600 bg-slate-100 border border-slate-200'
            }`}
          >
            {isPositive && <TrendingUp size={11} />}
            {isNegative && <TrendingDown size={11} />}
            <span>
              {change > 0 ? `+${change}` : change}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
