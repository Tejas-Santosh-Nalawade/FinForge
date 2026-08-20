import { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  RefreshCw,
  BookOpen,
  BrainCircuit,
  Lightbulb,
  Shield,
  Zap,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { fetchAISummary, EngineAISummary } from '@/services/api';

interface AIReviewProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

export function AIReview({ onNavigate, selectedDataset = 'error_data' }: AIReviewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EngineAISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAISummary(selectedDataset);
  }, [selectedDataset]);

  const loadAISummary = async (datasetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAISummary(datasetId);
      setData(res);
    } catch (err: any) {
      console.error('Error loading AI summary:', err);
      setError(err.message || 'Failed to generate AI review');
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;
  const isCleared = data?.overall_status === 'CLEARED';

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="ai" onNavigate={onNavigate} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-accent shrink-0">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Google AI Studio Financial Synthesis &amp; Report Analyst Guidance
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-accent border border-blue-200 flex items-center gap-1">
                <Sparkles size={10} /> {data?.ai_engine || 'Google AI Studio (Gemini 3.6 Flash)'}
              </span>
            </div>
            <p className="text-2xs text-slate-400 mt-0.5">
              Live executive intelligence synthesized from 28 deterministic audit tie-outs, ratio benchmarks, and rolling 8-quarter projections.
            </p>
          </div>
        </div>

        <button className="btn-primary shrink-0" onClick={() => onNavigate('wp514')}>
          <FileText size={13} />
          <span>Open WP-514 Workpaper</span>
        </button>
      </div>

      {loading && (
        <div className="card p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3 bg-white">
          <RefreshCw size={24} className="animate-spin text-accent" />
          <span className="font-bold text-slate-800 text-sm">Executing Google AI Studio Gemini API Synthesis...</span>
          <span className="text-2xs text-slate-400 max-w-md">
            Analyzing dataset <strong>{selectedDataset.toUpperCase()}</strong> across mechanical tie-out assertions, FP&amp;A ratios, and strategic forecasting models.
          </span>
        </div>
      )}

      {error && (
        <div className="card p-6 bg-red-50 border-red-200 text-red-700 text-xs font-medium text-center space-y-2">
          <AlertTriangle size={22} className="mx-auto text-red-500" />
          <p className="font-bold">⚠️ Gemini AI Service Notice: {error}</p>
        </div>
      )}

      {!loading && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Outlook Status Banner */}
            <div
              className={`card p-4 border flex items-center justify-between ${
                isCleared
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Audit Assurance Gate &amp; Financial Outlook Status
                </p>
                <p className="text-xl font-black mt-0.5 tracking-tight">
                  {isCleared ? 'PASSED & CLEARED ✓' : 'FLAGGED / REJECTED ⚠️'}
                </p>
                <p className="text-2xs text-slate-600 mt-0.5">
                  Dataset: <strong className="uppercase">{selectedDataset}</strong> | Deterministic Assurance Gate: <strong>{data?.overall_status}</strong>
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isCleared ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'
                }`}
              >
                <TrendingUp size={22} />
              </div>
            </div>

            {/* Executive Financial Summary */}
            <div className="card p-4.5 space-y-2 bg-white card-hover">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={15} className="text-accent" /> Executive Financial Summary
              </h3>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {summary.executive_summary}
              </p>
            </div>

            {/* High-Contrast Analyst Guidance Box: What to Think & Analyze for the Final Executive Report */}
            {summary.report_commentary && (
              <div className="card p-5 space-y-3 bg-slate-900 border-slate-800 text-white rounded-xl shadow-md">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2.5">
                  <BookOpen size={16} className="text-teal-400" />
                  <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    ANALYST GUIDANCE: WHAT TO THINK &amp; ANALYZE FOR THE FINAL EXECUTIVE REPORT
                  </h3>
                </div>
                <div className="text-xs text-slate-100 leading-relaxed font-sans whitespace-pre-line space-y-2">
                  {summary.report_commentary}
                </div>
              </div>
            )}

            {/* Deterministic Audit Findings */}
            <div className="card p-4.5 space-y-3 bg-white">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <ListChecks size={15} className="text-accent" /> Deterministic Audit Findings
              </h3>
              <div className="space-y-2 text-xs">
                {(summary.key_findings || []).map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span className="font-semibold text-slate-800">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Strategic Analyst Actions */}
            <div className="card p-4.5 space-y-3 bg-white">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" /> Strategic Analyst Recommendations
              </h3>
              <div className="space-y-2 text-xs">
                {(summary.recommended_actions || []).map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span className="font-medium text-slate-800">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-4">
            {/* Deterministic Score */}
            <div className="card p-4.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Deterministic Model Score
                </h3>
                <span className="text-xs font-bold font-mono text-accent">
                  {data?.confidenceScore ?? 84}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${isCleared ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${data?.confidenceScore ?? 84}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Calculated dynamically from 28 mechanical tie-out assertions and balance sheet equilibrium rules.
              </p>
            </div>

            {/* Key Risks */}
            <div className="card p-4.5 space-y-3 bg-white border-l-4 border-l-amber-500">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Key Financial &amp; Audit Risks
              </h3>
              <div className="space-y-2 text-xs">
                {(summary.key_risks || []).map((r: string, i: number) => (
                  <div key={i} className="p-2.5 rounded bg-amber-50/50 border border-amber-200/60 flex items-start gap-2">
                    <Shield size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium text-2xs">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Nav Button */}
            <button className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs" onClick={() => onNavigate('wp514')}>
              <span>Proceed to WP-514 Workpaper</span> <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
