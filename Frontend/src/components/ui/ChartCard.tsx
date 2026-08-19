import React from 'react';
import { EmptyState } from './EmptyState';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
  isEmpty = false,
  emptyTitle = 'No data available',
  emptyDescription = 'Upload financial statements to generate this analysis.',
  emptyIcon,
}: ChartCardProps) {
  return (
    <div className={`card p-4.5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-2xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {isEmpty ? (
        <div className="h-[200px] flex items-center justify-center bg-slate-50/70 rounded border border-dashed border-slate-200">
          <EmptyState
            compact
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
