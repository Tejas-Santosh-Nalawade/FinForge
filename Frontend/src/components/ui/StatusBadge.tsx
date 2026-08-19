import React from 'react';

interface StatusBadgeProps {
  status: 'critical' | 'warning' | 'success' | 'info' | 'faint';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const styles = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  faint: 'bg-slate-100 text-slate-600 border-slate-200',
};

const dots = {
  critical: 'bg-red-600',
  warning: 'bg-amber-600',
  success: 'bg-emerald-600',
  info: 'bg-blue-600',
  faint: 'bg-slate-400',
};

export function StatusBadge({ status, children, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium select-none ${styles[status]} ${
        size === 'sm' ? 'text-2xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {children}
    </span>
  );
}
