import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { AISummaryReport } from '@/types/financial';

const outlookStyles: Record<string, { color: string; bg: string; border: string }> = {
  MODERATE: { color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  POSITIVE: { color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  NEGATIVE: { color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200' },
};

interface AIReviewProps {
  onNavigate: (page: string) => void;
  report?: AISummaryReport | null;
  onGenerateSummary?: () => void;
}

export function AIReview({ onNavigate, report = null, onGenerateSummary }: AIReviewProps) {
  const [addedToWP, setAddedToWP] = useState(false);

  const outlook = report ? outlookStyles[report.outlook] || outlookStyles.MODERATE : null;

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="ai" onNavigate={onNavigate} />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-accent">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              AI-Powered Financial Review
            </h2>
            <p className="text-2xs text-slate-400">
              Executive synthesis based on financial analysis, forecast models, and validation checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={onGenerateSummary}
            disabled={!report && !onGenerateSummary}
          >
            <Sparkles size={13} />
            <span>Generate Summary</span>
          </button>
          {report && (
            <button
              className="btn-primary"
              onClick={() => {
                setAddedToWP(true);
                onNavigate('wp514');
              }}
              disabled={addedToWP}
            >
              <FileText size={13} />
              <span>{addedToWP ? 'Added to WP-514' : 'Add to WP-514'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content or Empty State */}
      {!report ? (
        <div className="card p-12">
          <EmptyState
            icon={Sparkles}
            title="AI Financial Review Not Available"
            description="Complete financial analysis, validation reviews, and forecast preparation to generate the AI-powered financial executive summary."
            action={
              <button className="btn-secondary" onClick={() => onNavigate('upload')}>
                Upload Data to Start
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main report sections */}
          <div className="lg:col-span-2 space-y-4">
            {/* Overall Assessment */}
            {outlook && (
              <div className={`card p-4.5 border ${outlook.border} ${outlook.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Overall Financial Outlook
                    </p>
                    <p className={`text-xl font-bold mt-0.5 ${outlook.color}`}>{report.outlook}</p>
                  </div>
                  <div className={`w-10 h-10 rounded bg-white/80 border border-current flex items-center justify-center ${outlook.color}`}>
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>
            )}

            {/* Executive Summary */}
            <div className="card p-4.5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Executive Summary
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{report.executiveSummary}</p>
            </div>

            {/* Key Findings */}
            {report.keyFindings && report.keyFindings.length > 0 && (
              <div className="card p-4.5 space-y-2">
                <div className="flex items-center gap-2">
                  <ListChecks size={14} className="text-accent" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Key Findings
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.keyFindings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Financial Outlook */}
            {report.financialOutlook && (
              <div className="card p-4.5 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-accent" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Financial Outlook
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{report.financialOutlook}</p>
              </div>
            )}

            {/* Key Risks */}
            {report.keyRisks && report.keyRisks.length > 0 && (
              <div className="card p-4.5 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-status-warning" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Identified Strategic Risks
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.keyRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle size={13} className="text-status-warning mt-0.5 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            {report.recommendedActions && report.recommendedActions.length > 0 && (
              <div className="card p-4.5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-status-success" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Recommended Actions
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {report.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-status-success mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right sidebar: AI Confidence and Actions */}
          <div className="space-y-4">
            {report.confidenceScore !== undefined && (
              <div className="card p-4.5 space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Model Confidence
                </h3>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${report.confidenceScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {report.confidenceScore}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Score derived from statement tie-out completeness, variance accuracy, and driver coverage.
                </p>
              </div>
            )}

            <button className="btn-primary w-full" onClick={() => onNavigate('wp514')}>
              <span>Proceed to WP-514 Working Paper</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
