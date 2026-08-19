import { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { Modal } from '@/components/ui/Modal';
import { Toast, useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { defaultReports } from '@/config/navigation';
import { ReportDefinition } from '@/types/financial';

interface ReportsProps {
  onNavigate: (page: string) => void;
  reportsList?: ReportDefinition[];
  companyName?: string | null;
  period?: string | null;
}

export function Reports({
  onNavigate,
  reportsList = defaultReports,
  companyName = '—',
  period = '—',
}: ReportsProps) {
  const { visible, message, show } = useToast();
  const [previewReport, setPreviewReport] = useState<ReportDefinition | null>(null);
  const [exporting, setExporting] = useState(false);

  const hasGeneratedReports = reportsList.some((r) => r.generated);

  const handleExport = (report: ReportDefinition, format: string) => {
    if (!report.generated) {
      show(`Cannot export ${report.name}: report has not been generated yet.`, 'error');
      return;
    }
    show(`${report.name} (${format}) exported successfully.`);
  };

  const handleExportAll = () => {
    if (!hasGeneratedReports) {
      show('No generated reports available for export.', 'error');
      return;
    }
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      show('Complete report package exported successfully.');
    }, 1200);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="reports" onNavigate={onNavigate} />

      {/* Export all banner */}
      <div className="card p-4.5 bg-slate-50 border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-subtle">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Export Complete Deliverables Package
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Bundle WP-514, Financial Analysis, Forecast Model, and Executive Summary into one export package.
            </p>
          </div>
        </div>
        <button
          className="btn-secondary shrink-0 self-start sm:self-auto"
          onClick={handleExportAll}
          disabled={!hasGeneratedReports || exporting}
        >
          {exporting ? (
            <>
              <CheckCircle2 size={13} className="animate-pulse" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download size={13} />
              <span>Export Complete Package</span>
            </>
          )}
        </button>
      </div>

      {/* Status banner when no reports generated */}
      {!hasGeneratedReports && (
        <div className="card p-6 text-center">
          <EmptyState
            compact
            icon={FileText}
            title="No reports generated"
            description="Complete the financial analysis workflow (Upload → Review → Analytics → Forecast → AI Review → WP-514) to generate deliverable reports."
            action={
              <button className="btn-secondary" onClick={() => onNavigate('upload')}>
                Start Financial Workflow
              </button>
            }
          />
        </div>
      )}

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((report) => {
          const isGenerated = Boolean(report.generated);
          return (
            <div
              key={report.id}
              className={`card p-4.5 space-y-3 ${
                !isGenerated ? 'bg-slate-50/50' : 'card-hover bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
                    isGenerated
                      ? 'bg-blue-50 text-accent border border-blue-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <FileText size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{report.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isGenerated
                          ? 'bg-emerald-50 text-status-success border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {isGenerated ? 'Ready' : 'Not generated'}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400 mt-1 leading-relaxed">{report.description}</p>
                </div>
              </div>

              {/* Format badges */}
              <div className="flex items-center gap-1.5">
                {report.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                  >
                    {fmt === 'PDF' ? <File size={11} /> : <FileSpreadsheet size={11} />}
                    {fmt}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-border-subtle">
                <button
                  className="btn-secondary text-2xs"
                  onClick={() => setPreviewReport(report)}
                  disabled={!isGenerated}
                >
                  <Eye size={12} /> Preview
                </button>
                {report.formats.map((fmt) => (
                  <button
                    key={fmt}
                    className="btn-secondary text-2xs"
                    onClick={() => handleExport(report, fmt)}
                    disabled={!isGenerated}
                  >
                    <Download size={12} /> Export {fmt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to dashboard button */}
      <div className="flex justify-center pt-3">
        <button className="btn-ghost" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <Modal
          open={Boolean(previewReport)}
          onClose={() => setPreviewReport(null)}
          title={`Preview — ${previewReport.name}`}
          footer={
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={() => setPreviewReport(null)}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  handleExport(previewReport, 'PDF');
                  setPreviewReport(null);
                }}
              >
                <Download size={13} /> Export PDF
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border-subtle">
              <FileText size={15} className="text-accent" />
              <span className="font-bold text-slate-900">
                {companyName || 'Entity'} — {period || 'Period'}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-border-subtle space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Document Overview
              </p>
              <p className="text-slate-700 leading-relaxed">
                Deliverable report for {companyName || 'the reporting entity'} ({period || 'current period'}).
                Includes performance analytics, tie-out procedures, forecast drivers, and executive findings.
              </p>
            </div>
          </div>
        </Modal>
      )}

      <Toast message={message} visible={visible} />
    </div>
  );
}
