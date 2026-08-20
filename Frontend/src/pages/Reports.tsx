import { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { getDownloadUrl } from '@/services/api';

interface ReportsProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

export function Reports({
  onNavigate,
  selectedDataset = 'error_data',
}: ReportsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const deliverables = [
    {
      id: 'audit_pdf',
      name: 'Deliverable A: Audit Tie-Outs & Deterministic Rules PDF Report',
      description: 'Audit tie-outs report verifying all 28 mechanical formulas, trial balance checks, and findings.',
      format: 'PDF',
      fileType: 'audit_pdf',
    },
    {
      id: 'fpa_pdf',
      name: 'Deliverable B: FP&A Analytics & Financial Ratio PDF Report',
      description: 'Corporate FP&A intelligence report with profitability, liquidity, efficiency ratios & baseline charts.',
      format: 'PDF',
      fileType: 'fpa_pdf',
    },
    {
      id: 'strategic_pdf',
      name: 'Deliverables 4Q/8Q: Strategic Planning Recommendations PDF Report',
      description: 'Forward-looking strategic recommendations and 8-quarter rolling forecast projections report.',
      format: 'PDF',
      fileType: 'strategic_pdf',
    },
    {
      id: 'wp514_excel',
      name: 'WP-514 Working Paper Supporting Excel Workpaper',
      description: 'Dynamic Excel lead schedule workpaper containing formulas, tick-marks, and procedure reconciliations.',
      format: 'EXCEL',
      fileType: 'wp514_excel',
    },
    {
      id: 'audit_json',
      name: 'Deliverable A: Audit Tie-Outs JSON Payload',
      description: 'Raw JSON payload containing structured procedure statuses and audit findings.',
      format: 'JSON',
      fileType: 'audit_json',
    },
    {
      id: 'fpa_json',
      name: 'Deliverable B: FP&A Analytics JSON Payload',
      description: 'Raw JSON payload containing Stage 3 ratio calculations and historical baseline data.',
      format: 'JSON',
      fileType: 'fpa_json',
    },
  ];

  const handleDownload = (fileType: string) => {
    setDownloading(fileType);
    const url = getDownloadUrl(selectedDataset, fileType);
    window.open(url, '_blank');
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="reports" onNavigate={onNavigate} />

      {/* Export all banner */}
      <div className="card p-4.5 bg-slate-900 text-white border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wide">
              FastAPI Backend Generated Deliverables for: <span className="text-accent">{selectedDataset.toUpperCase()}</span>
            </h3>
            <p className="text-2xs text-slate-300 mt-0.5">
              Download PDF audit reports, FP&amp;A analytics, strategic recommendations, and WP-514 Excel workpapers.
            </p>
          </div>
        </div>
      </div>

      {/* Deliverable cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.map((item) => (
          <div key={item.id} className="card p-4.5 space-y-3 bg-white card-hover">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-blue-50 text-accent border border-blue-200 flex items-center justify-center shrink-0">
                {item.format === 'EXCEL' ? <FileSpreadsheet size={17} /> : <FileText size={17} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{item.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Engine Generated
                  </span>
                </div>
                <p className="text-2xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {item.format === 'EXCEL' ? <FileSpreadsheet size={11} /> : <File size={11} />}
                {item.format}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2.5 border-t border-border-subtle">
              <button
                className="btn-primary text-xs w-full flex items-center justify-center gap-1.5"
                onClick={() => handleDownload(item.fileType)}
                disabled={downloading === item.fileType}
              >
                {downloading === item.fileType ? (
                  <>
                    <CheckCircle2 size={13} className="animate-pulse" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Download {item.format} Deliverable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-3">
        <button className="btn-ghost" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
