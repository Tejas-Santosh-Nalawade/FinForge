import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Eye,
  CheckCircle2,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { fetchWP514Data, getDownloadUrl, WP514Data } from '@/services/api';

interface WP514Props {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

export function WP514({
  onNavigate,
  selectedDataset = 'error_data',
}: WP514Props) {
  const [data, setData] = useState<WP514Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadWP514(selectedDataset);
  }, [selectedDataset]);

  const loadWP514 = async (datasetId: string) => {
    setLoading(true);
    try {
      const res = await fetchWP514Data(datasetId);
      setData(res);
    } catch (err: any) {
      console.error('Error loading WP-514 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const excelDownloadUrl = getDownloadUrl(selectedDataset, 'wp514_excel');

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="wp514" onNavigate={onNavigate} />

      {loading && (
        <div className="card p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw size={15} className="animate-spin text-accent" />
          <span>Generating Working Paper WP-514 Lead Schedule reconciliation...</span>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Header Info Block */}
          <div className="card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <p className="kpi-label">Workpaper Ref</p>
                <p className="text-xs font-bold text-accent font-mono mt-1">{data.wp_reference}</p>
              </div>
              <div>
                <p className="kpi-label">Reporting Period</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{data.period}</p>
              </div>
              <div>
                <p className="kpi-label">Assurance Gate Status</p>
                <div className="mt-1">
                  <StatusBadge status={data.overall_status === 'CLEARED' ? 'success' : 'critical'} size="md">
                    {data.overall_status}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="kpi-label">Reconciled Tie-Outs</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {data.passed_procedures} / {data.total_procedures} Passed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={excelDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
              >
                <Download size={14} />
                <span>Download WP-514 Excel Workpaper</span>
              </a>
            </div>
          </div>

          {/* Lead Schedule Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                WP-514 Supporting Lead Schedule &amp; Tick-Mark Matrix
              </h3>
              <span className="text-2xs font-mono text-slate-400">
                {data.schedules.length} line items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Ref</th>
                    <th className="table-header">Tick</th>
                    <th className="table-header">Procedure &amp; Account Line</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Calculated</th>
                    <th className="table-header">Reported</th>
                    <th className="table-header">Variance</th>
                    <th className="table-header">Tie-Out Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schedules.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-mono text-accent text-2xs font-bold">{row.wp_ref}</td>
                      <td className="table-cell font-bold text-sm">
                        <span className={row.status === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>
                          {row.tick_mark}
                        </span>
                      </td>
                      <td className="table-cell text-slate-900 font-medium text-xs max-w-xs truncate">
                        {row.procedure_name}
                      </td>
                      <td className="table-cell text-slate-600 text-xs">{row.category}</td>
                      <td className="table-cell font-mono text-xs text-slate-700">
                        {row.calculated_value !== undefined ? String(row.calculated_value) : '—'}
                      </td>
                      <td className="table-cell font-mono text-xs text-slate-700">
                        {row.reported_value !== undefined ? String(row.reported_value) : '—'}
                      </td>
                      <td className="table-cell font-mono text-xs">
                        {row.variance !== 0 ? (
                          <span className="text-red-600 font-bold">${row.variance.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">$0</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={row.status === 'PASS' ? 'success' : 'critical'}>
                          {row.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Findings & Action Footer */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <span>Audit Workpaper Conclusions &amp; Sign-Off</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 p-3 rounded border border-border-subtle">
              {data.conclusion.text || 'Audit procedures completed with full tie-out verification.'}
            </p>

            <div className="flex items-center justify-between pt-2">
              <button className="btn-secondary" onClick={() => setPreviewOpen(true)}>
                <Eye size={13} /> <span>Inspect Full Workpaper Details</span>
              </button>
              <button className="btn-primary" onClick={() => onNavigate('reports')}>
                <span>Continue to Reports &amp; Exports</span> <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="WP-514 Workpaper Details"
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
              WP-514 Lead Schedule Audit Trail — {data?.period}
            </span>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {data?.schedules.map((s, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-50 border border-border-subtle text-xs">
                <div className="flex justify-between font-mono font-bold text-slate-700">
                  <span>{s.wp_ref}: {s.procedure_name}</span>
                  <span className={s.status === 'PASS' ? 'text-emerald-600' : 'text-red-600'}>{s.status}</span>
                </div>
                {s.notes && <p className="text-2xs text-slate-500 mt-1">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
