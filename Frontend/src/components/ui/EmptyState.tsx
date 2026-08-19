import React from 'react';
import { LucideIcon, FileSpreadsheet } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileSpreadsheet,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${
        compact ? 'py-6 px-4' : 'py-10 px-6'
      } ${className}`}
    >
      <div
        className={`rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 ${
          compact ? 'w-8 h-8' : 'w-11 h-11'
        }`}
      >
        <Icon size={compact ? 16 : 20} strokeWidth={1.75} />
      </div>
      <h4 className="text-xs font-semibold text-slate-700 tracking-tight">{title}</h4>
      {description && (
        <p className="text-2xs text-slate-400 mt-1 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}
