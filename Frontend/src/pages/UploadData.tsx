import React, { useRef, useState } from 'react';
import {
  FileText,
  Layers,
  Scale,
  Calculator,
  TrendingUp,
  Activity,
  MessageSquare,
  UploadCloud,
  Trash2,
  FileSpreadsheet,
  FileType,
  ArrowRight,
  X,
  File,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { supportedDataTypes } from '@/config/navigation';
import { UploadedFile } from '@/types/financial';

const typeIcons: Record<string, LucideIcon> = {
  'file-text': FileText,
  layers: Layers,
  scale: Scale,
  calculator: Calculator,
  'trending-up': TrendingUp,
  activity: Activity,
  'message-square': MessageSquare,
};

interface UploadDataProps {
  onNavigate: (page: string) => void;
  files?: UploadedFile[];
  onFilesChange?: (files: UploadedFile[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return 'Excel';
    case 'csv':
      return 'CSV';
    case 'pdf':
      return 'PDF';
    case 'docx':
    case 'doc':
      return 'Word';
    default:
      return 'Document';
  }
}

export function UploadData({ onNavigate, files = [], onFilesChange }: UploadDataProps) {
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>(files);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFiles = (newFiles: UploadedFile[]) => {
    setLocalFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const handleNativeFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const added: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: f.name,
      type: getFileTypeLabel(f.name),
      size: formatFileSize(f.size),
      status: 'Selected',
      fileObject: f,
      uploadedAt: new Date(),
    }));

    updateFiles([...localFiles, ...added]);
  };

  const removeFile = (id: string) => {
    updateFiles(localFiles.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    updateFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="upload" onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload area + file table */}
        <div className="lg:col-span-2 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              handleNativeFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleNativeFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`card p-8 border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer select-none ${
              dragging
                ? 'border-accent bg-blue-50/50'
                : 'border-slate-300 hover:border-accent hover:bg-slate-50/50'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                dragging
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Drag &amp; drop financial files here, or click to browse
            </p>
            <p className="text-2xs text-slate-400 mt-1">
              Select statements, trial balances, budgets, or forecast workbooks
            </p>

            <div className="flex items-center gap-1.5 mt-4">
              {['XLSX', 'XLS', 'CSV', 'PDF', 'DOCX'].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Selected Files Table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Uploaded Files
              </h3>
              <span className="text-2xs text-slate-400 font-medium">
                {localFiles.length} {localFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">File Name</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Size</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {localFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                      No files uploaded. Select or drag files above to begin ingestion.
                    </td>
                  </tr>
                ) : (
                  localFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          {file.type === 'PDF' ? (
                            <FileType size={15} className="text-red-500 shrink-0" />
                          ) : file.type === 'Excel' || file.type === 'CSV' ? (
                            <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                          ) : (
                            <File size={15} className="text-blue-500 shrink-0" />
                          )}
                          <span className="truncate max-w-xs">{file.name}</span>
                        </div>
                      </td>
                      <td className="table-cell">{file.type}</td>
                      <td className="table-cell text-slate-500 font-mono text-2xs">{file.size}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {file.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          {localFiles.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <button className="btn-ghost" onClick={clearAll}>
                <X size={13} /> Clear All
              </button>
              <button className="btn-primary" onClick={() => onNavigate('ingestion')}>
                <span>Start Ingestion</span> <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Supported data types panel */}
        <div className="card p-4 h-fit space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Supported Data Sources
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Financial data formats supported for statement analysis &amp; FP&amp;A modeling.
            </p>
          </div>
          <div className="space-y-1.5">
            {supportedDataTypes.map((dt) => {
              const Icon = typeIcons[dt.icon];
              return (
                <div
                  key={dt.name}
                  className="flex items-start gap-2.5 p-2 rounded bg-slate-50 border border-border-subtle"
                >
                  <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    {Icon && <Icon size={13} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 leading-tight">{dt.name}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{dt.format}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
