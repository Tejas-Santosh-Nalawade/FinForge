import { ArrowRight, Circle, FileSpreadsheet, FileType, File, Clock, UploadCloud } from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { defaultIngestionPipeline } from '@/config/navigation';
import { IngestionStep, UploadedFile } from '@/types/financial';

interface IngestionProps {
  onNavigate: (page: string) => void;
  files?: UploadedFile[];
  steps?: IngestionStep[];
}

export function Ingestion({
  onNavigate,
  files = [],
  steps = defaultIngestionPipeline,
}: IngestionProps) {
  const hasFiles = files.length > 0;

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="upload" onNavigate={onNavigate} />

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Main Status Card */}
        <div className="card p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
              {hasFiles ? <Clock size={22} /> : <UploadCloud size={22} />}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {hasFiles ? 'Ready for Ingestion Pipeline' : 'Waiting for Files'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {hasFiles
                ? `${files.length} financial ${files.length === 1 ? 'file is' : 'files are'} queued. Connect backend ingestion to process extraction, normalization, and validation rules.`
                : 'Upload financial statements, general ledgers, or planning workbooks to begin data ingestion.'}
            </p>
          </div>

          {!hasFiles && (
            <div className="pt-2">
              <button className="btn-primary" onClick={() => onNavigate('upload')}>
                <UploadCloud size={13} />
                <span>Go to Upload Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Ingestion Pipeline Stages */}
        <div className="card p-5 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Ingestion Pipeline Stages
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Standard data extraction and analytical preparation workflow.
            </p>
          </div>

          <div className="space-y-1.5">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 p-2.5 rounded bg-slate-50 border border-border-subtle"
              >
                <div className="shrink-0 text-slate-400">
                  <Circle size={15} />
                </div>
                <span className="text-xs font-medium text-slate-600 flex-1">{step.label}</span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Files Queue */}
        {hasFiles && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Files Queued for Processing
                </h3>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Actual files staged for extraction and normalization.
                </p>
              </div>
              <span className="text-2xs text-slate-400 font-mono font-medium">
                {files.length} {files.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-1.5">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2.5 p-2 rounded bg-slate-50 border border-border-subtle text-xs"
                >
                  {f.type === 'PDF' ? (
                    <FileType size={15} className="text-red-500 shrink-0" />
                  ) : f.type === 'Excel' || f.type === 'CSV' ? (
                    <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                  ) : (
                    <File size={15} className="text-blue-500 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 flex-1 truncate">{f.name}</span>
                  <span className="text-2xs text-slate-400 font-mono">{f.size}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                    Staged
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border-subtle">
              <button className="btn-secondary" onClick={() => onNavigate('upload')}>
                Modify Files
              </button>
              <button className="btn-primary" onClick={() => onNavigate('data-review')}>
                <span>Continue to Data Review</span> <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
