import { useState } from 'react';
import {
  X,
  FileSearch,
  Check,
  Ban,
  Eye,
  ArrowRight,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar, FilterSelect, SearchInput } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ValidationException } from '@/types/financial';

const severityMap = {
  critical: 'critical' as const,
  warning: 'warning' as const,
  info: 'info' as const,
};

const statusMap = {
  Open: 'critical' as const,
  Resolved: 'success' as const,
  Waived: 'faint' as const,
};

interface DataReviewProps {
  onNavigate: (page: string) => void;
  exceptions?: ValidationException[];
  onUpdateExceptionStatus?: (id: string, status: 'Resolved' | 'Waived') => void;
  totalRecordsReviewed?: number | null;
  passedChecksCount?: number | null;
}

export function DataReview({
  onNavigate,
  exceptions = [],
  onUpdateExceptionStatus,
  totalRecordsReviewed = null,
  passedChecksCount = null,
}: DataReviewProps) {
  const [localExceptions, setLocalExceptions] = useState<ValidationException[]>(exceptions);
  const [selected, setSelected] = useState<ValidationException | null>(null);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');

  const areas = ['All', ...Array.from(new Set(localExceptions.map((e) => e.area)))];

  const filtered = localExceptions.filter((e) => {
    const matchSearch =
      e.issue.toLowerCase().includes(search.toLowerCase()) ||
      e.area.toLowerCase().includes(search.toLowerCase()) ||
      e.id.includes(search);
    const matchSev = sevFilter === 'All' || e.severity === sevFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchArea = areaFilter === 'All' || e.area === areaFilter;
    return matchSearch && matchSev && matchStatus && matchArea;
  });

  const updateStatus = (id: string, status: 'Resolved' | 'Waived') => {
    setLocalExceptions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    onUpdateExceptionStatus?.(id, status);
  };

  const criticalCount = localExceptions.filter((e) => e.severity === 'critical' && e.status === 'Open').length;
  const warningCount = localExceptions.filter((e) => e.severity === 'warning' && e.status === 'Open').length;
  const resolvedCount = localExceptions.filter((e) => e.status === 'Resolved').length;

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="review" onNavigate={onNavigate} />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Records Reviewed"
          value={totalRecordsReviewed !== null ? totalRecordsReviewed : '—'}
          emptyText="—"
        />
        <KpiCard
          label="Critical Issues"
          value={criticalCount > 0 ? String(criticalCount) : '0'}
          accent={criticalCount > 0}
        />
        <KpiCard
          label="Warnings"
          value={warningCount > 0 ? String(warningCount) : '0'}
        />
        <KpiCard
          label="Passed Checks"
          value={passedChecksCount !== null ? passedChecksCount : '—'}
          emptyText="—"
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by issue, field, or ID..."
          disabled={localExceptions.length === 0}
        />
        <FilterSelect
          label="Severity"
          value={sevFilter}
          options={['All', 'Critical', 'Warning', 'Info']}
          onChange={setSevFilter}
          disabled={localExceptions.length === 0}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={['All', 'Open', 'Resolved', 'Waived']}
          onChange={setStatusFilter}
          disabled={localExceptions.length === 0}
        />
        <FilterSelect
          label="Area"
          value={areaFilter}
          options={areas}
          onChange={setAreaFilter}
          disabled={localExceptions.length === 0}
        />
      </FilterBar>

      {/* Exceptions Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-slate-50">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Validation Exceptions
          </h3>
          <span className="text-2xs text-slate-400 font-medium font-mono">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Area</th>
                <th className="table-header">Field</th>
                <th className="table-header">Issue</th>
                <th className="table-header">Rule</th>
                <th className="table-header">Severity</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No validation results available"
                      description="Upload and process financial statements to run automated tie-out and validation checks."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((exc) => (
                  <tr
                    key={exc.id}
                    onClick={() => setSelected(exc)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="table-cell font-mono text-slate-500 text-2xs">{exc.id}</td>
                    <td className="table-cell font-medium text-slate-700">{exc.area}</td>
                    <td className="table-cell text-slate-600">{exc.field}</td>
                    <td className="table-cell text-slate-900 font-medium max-w-xs truncate">{exc.issue}</td>
                    <td className="table-cell text-slate-500 text-2xs font-mono">{exc.rule}</td>
                    <td className="table-cell">
                      <StatusBadge status={severityMap[exc.severity]}>
                        {exc.severity.charAt(0).toUpperCase() + exc.severity.slice(1)}
                      </StatusBadge>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={statusMap[exc.status]}>{exc.status}</StatusBadge>
                    </td>
                    <td className="table-cell text-right">
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-2xs text-slate-400">
          {localExceptions.length > 0
            ? `${resolvedCount} of ${localExceptions.length} exceptions resolved`
            : '0 exceptions'}
        </div>
        <button className="btn-primary" onClick={() => onNavigate('analytics')}>
          <span>Continue to Financial Analytics</span> <ArrowRight size={13} />
        </button>
      </div>

      {/* Exception Detail Drawer */}
      {selected && (
        <ExceptionDrawer
          exception={selected}
          onClose={() => setSelected(null)}
          onAccept={() => updateStatus(selected.id, 'Resolved')}
          onWaive={() => updateStatus(selected.id, 'Waived')}
        />
      )}
    </div>
  );
}

interface ExceptionDrawerProps {
  exception: ValidationException;
  onClose: () => void;
  onAccept: () => void;
  onWaive: () => void;
}

function ExceptionDrawer({ exception, onClose, onAccept, onWaive }: ExceptionDrawerProps) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white border-l border-border-subtle z-50 animate-slide-in-right overflow-y-auto shadow-dropdown">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle sticky top-0 bg-slate-50 z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Exception Details
            </h3>
            <p className="text-2xs text-slate-400 font-mono mt-0.5">ID: #{exception.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Issue */}
          <div>
            <p className="kpi-label mb-1">Issue Description</p>
            <p className="font-semibold text-slate-900 leading-snug">{exception.issue}</p>
          </div>

          {/* Rule */}
          <div>
            <p className="kpi-label mb-1">Validation Rule</p>
            <div className="p-2.5 rounded bg-slate-50 border border-border-subtle font-mono text-accent text-2xs">
              {exception.rule}
            </div>
          </div>

          {/* Values if available */}
          {(exception.expected || exception.calculated || exception.difference) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-2.5 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">Expected</p>
                <p className="font-semibold text-slate-800">{exception.expected || '—'}</p>
              </div>
              <div className="card p-2.5 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">Calculated</p>
                <p className="font-semibold text-slate-800">{exception.calculated || '—'}</p>
              </div>
              <div className="card p-2.5 text-center border-red-200 bg-red-50/50">
                <p className="text-[10px] text-red-500 mb-0.5">Variance</p>
                <p className="font-semibold text-status-critical">{exception.difference || '—'}</p>
              </div>
            </div>
          )}

          {/* Explanation if available */}
          {exception.explanation && (
            <div>
              <p className="kpi-label mb-1">Audit Explanation</p>
              <div className="flex gap-2 p-2.5 rounded bg-blue-50/50 border border-blue-200/60 text-slate-700 leading-relaxed">
                <AlertCircle size={15} className="text-accent shrink-0 mt-0.5" />
                <p>{exception.explanation}</p>
              </div>
            </div>
          )}

          {/* Source Reference */}
          {exception.source && (
            <div>
              <p className="kpi-label mb-1">Source Reference</p>
              <div className="p-2.5 rounded bg-slate-50 border border-border-subtle space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <FileSearch size={13} className="text-slate-400" />
                  <span>{exception.source.file}</span>
                </div>
                {(exception.source.sheet || exception.source.row) && (
                  <div className="text-2xs text-slate-400 pl-4 space-x-2">
                    {exception.source.sheet && <span>Sheet: {exception.source.sheet}</span>}
                    {exception.source.row && <span>Location: {exception.source.row}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="kpi-label mb-1">Status</p>
            <StatusBadge status={statusMap[exception.status]} size="md">
              {exception.status}
            </StatusBadge>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border-subtle flex gap-2">
            <button
              onClick={onAccept}
              className="btn-secondary flex-1"
              disabled={exception.status === 'Resolved'}
            >
              <Check size={13} /> Accept Adjustment
            </button>
            <button
              onClick={onWaive}
              className="btn-secondary flex-1"
              disabled={exception.status === 'Waived'}
            >
              <Ban size={13} /> Waive Exception
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
