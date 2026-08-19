import { useState } from 'react';
import {
  ArrowRight,
  Save,
  Eye,
  CheckCircle2,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { standardAuditProcedures } from '@/config/navigation';
import { WP514Finding, WP514Procedure } from '@/types/financial';

const statusMap = {
  Open: 'critical' as const,
  Resolved: 'success' as const,
  Waived: 'faint' as const,
};

interface WP514Props {
  onNavigate: (page: string) => void;
  entityName?: string | null;
  reportingPeriod?: string | null;
  preparedBy?: string | null;
  findings?: WP514Finding[];
  procedures?: WP514Procedure[];
}

export function WP514({
  onNavigate,
  entityName = '—',
  reportingPeriod = '—',
  preparedBy = '—',
  findings = [],
  procedures = standardAuditProcedures,
}: WP514Props) {
  const [localFindings, setLocalFindings] = useState<WP514Finding[]>(findings);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [reviewers, setReviewers] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'Draft' | 'Finalized'>('Draft');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const criticalCount = localFindings.filter((f) => f.status === 'Open').length;
  const warningCount = localFindings.filter((f) => f.impact && f.impact.includes('-')).length;
  const resolvedCount = localFindings.filter((f) => f.status === 'Resolved').length;
  const outstandingCount = localFindings.filter((f) => f.status === 'Open').length;

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const finalize = () => {
    setStatus('Finalized');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="wp514" onNavigate={onNavigate} />

      {/* Header Info Block */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p className="kpi-label">Status</p>
            <div className="mt-1">
              <StatusBadge status={status === 'Finalized' ? 'success' : 'warning'} size="md">
                {status}
              </StatusBadge>
            </div>
          </div>
          <div>
            <p className="kpi-label">Entity</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{entityName || '—'}</p>
          </div>
          <div>
            <p className="kpi-label">Reporting Period</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{reportingPeriod || '—'}</p>
          </div>
          <div>
            <p className="kpi-label">Prepared By</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{preparedBy || '—'}</p>
          </div>
          <div>
            <p className="kpi-label">Review Status</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">
              {status === 'Finalized' ? 'Reviewed' : 'Pending Review'}
            </p>
          </div>
        </div>
      </div>

      {/* Standard Audit Procedures */}
      <div className="card p-4.5 space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Working Paper Review Procedures
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">
            Standard analytical review procedures and tie-out verification steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {procedures.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-border-subtle"
            >
              <CheckCircle2
                size={15}
                className={p.done ? 'text-status-success shrink-0' : 'text-slate-300 shrink-0'}
              />
              <span className="text-xs font-medium text-slate-700 leading-tight">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3.5 border-red-200/60 bg-red-50/20">
          <p className="kpi-label">Critical Findings</p>
          <p className="text-xl font-bold mt-1 text-status-critical">{criticalCount}</p>
        </div>
        <div className="card p-3.5 border-amber-200/60 bg-amber-50/20">
          <p className="kpi-label">Warnings</p>
          <p className="text-xl font-bold mt-1 text-status-warning">{warningCount}</p>
        </div>
        <div className="card p-3.5 border-emerald-200/60 bg-emerald-50/20">
          <p className="kpi-label">Resolved</p>
          <p className="text-xl font-bold mt-1 text-status-success">{resolvedCount}</p>
        </div>
        <div className="card p-3.5">
          <p className="kpi-label">Outstanding</p>
          <p className="text-xl font-bold mt-1 text-slate-800">{outstandingCount}</p>
        </div>
      </div>

      {/* Findings Detail List or Empty State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Working Paper Findings Detail
          </h3>
          <span className="text-2xs text-slate-400 font-mono">
            {localFindings.length} {localFindings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {localFindings.length === 0 ? (
          <div className="card p-12">
            <EmptyState
              icon={ClipboardList}
              title="No WP-514 findings available"
              description="Complete financial statement review and validation procedures to populate findings on this working paper."
            />
          </div>
        ) : (
          localFindings.map((finding) => (
            <div key={finding.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-slate-400 font-bold">#{finding.id}</span>
                  <StatusBadge status={statusMap[finding.status]}>{finding.status}</StatusBadge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Area</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{finding.area}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issue</p>
                  <p className="text-xs text-slate-700 mt-0.5">{finding.issue}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Impact</p>
                  <p className="text-xs font-semibold text-status-warning mt-0.5">{finding.impact || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-border-subtle">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Action / Reviewer Note
                  </label>
                  <textarea
                    value={comments[finding.id] || finding.actionComment || ''}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [finding.id]: e.target.value }))
                    }
                    placeholder="Enter audit note..."
                    rows={2}
                    className="input resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Reviewer Sign-off
                  </label>
                  <input
                    value={reviewers[finding.id] || finding.reviewer || ''}
                    onChange={(e) =>
                      setReviewers((prev) => ({ ...prev, [finding.id]: e.target.value }))
                    }
                    placeholder="Reviewer name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Review Date
                  </label>
                  <input
                    type="date"
                    value={dates[finding.id] || finding.date || ''}
                    onChange={(e) =>
                      setDates((prev) => ({ ...prev, [finding.id]: e.target.value }))
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <div>
          {saved && (
            <span className="text-xs text-status-success flex items-center gap-1.5 animate-fade-in font-medium">
              <CheckCircle2 size={14} /> Draft saved successfully
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={save} disabled={localFindings.length === 0}>
            <Save size={13} /> Save Draft
          </button>
          <button className="btn-secondary" onClick={() => setPreviewOpen(true)} disabled={localFindings.length === 0}>
            <Eye size={13} /> Preview
          </button>
          <button
            className="btn-primary"
            onClick={finalize}
            disabled={status === 'Finalized' || localFindings.length === 0}
          >
            <CheckCircle2 size={13} /> {status === 'Finalized' ? 'Finalized' : 'Finalize WP-514'}
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('reports')}>
            <span>Reports &amp; Exports</span> <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="WP-514 Working Paper — Preview"
        footer={
          <button className="btn-secondary" onClick={() => setPreviewOpen(false)}>
            Close
          </button>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle">
            <FileText size={15} className="text-accent" />
            <span className="font-bold text-slate-900">
              {entityName || 'Entity'} — {reportingPeriod || 'Period'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
              Procedures Performed
            </p>
            <div className="space-y-1">
              {procedures.map((p) => (
                <div key={p.label} className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 size={13} className={p.done ? 'text-status-success' : 'text-slate-300'} />
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
          {localFindings.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
                Findings Summary
              </p>
              <div className="space-y-1.5">
                {localFindings.map((f) => (
                  <div key={f.id} className="p-2 rounded bg-slate-50 border border-border-subtle">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-2xs font-mono text-slate-400 font-bold">#{f.id}</span>
                      <StatusBadge status={statusMap[f.status]}>{f.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{f.issue}</p>
                    <p className="text-2xs text-slate-400 mt-0.5">Impact: {f.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
