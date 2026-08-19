import { useState } from 'react';
import {
  ArrowRight,
  Plus,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  BarChart3,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InsightItem } from '@/types/financial';

const priorityStyles = {
  High: { badge: 'critical' as const, bg: 'bg-red-50 text-status-critical border-red-200' },
  Medium: { badge: 'warning' as const, bg: 'bg-amber-50 text-status-warning border-amber-200' },
  Low: { badge: 'info' as const, bg: 'bg-blue-50 text-accent border-blue-200' },
};

const sectionTitles = {
  key: 'Key Insights',
  risk: 'Risks',
  opportunity: 'Opportunities',
};

interface InsightsProps {
  onNavigate: (page: string) => void;
  insightsList?: InsightItem[];
}

export function Insights({ onNavigate, insightsList = [] }: InsightsProps) {
  const [addedToReport, setAddedToReport] = useState<Set<string>>(new Set());

  const addToReport = (id: string) => {
    setAddedToReport((prev) => new Set(prev).add(id));
  };

  const keyCount = insightsList.filter((i) => i.section === 'key').length;
  const riskCount = insightsList.filter((i) => i.section === 'risk').length;
  const oppCount = insightsList.filter((i) => i.section === 'opportunity').length;

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="insights" onNavigate={onNavigate} />

      {/* Summary section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-accent">
            <Lightbulb size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Key Insights</p>
            <p className="text-2xs text-slate-400 font-mono">{keyCount} items</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-status-warning">
            <AlertTriangle size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Identified Risks</p>
            <p className="text-2xs text-slate-400 font-mono">{riskCount} items</p>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-status-success">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Opportunities</p>
            <p className="text-2xs text-slate-400 font-mono">{oppCount} items</p>
          </div>
        </div>
      </div>

      {/* Insights Cards or Empty State */}
      {insightsList.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon={Lightbulb}
            title="No insights available"
            description="Insights, risks, and strategic recommendations will appear after financial analysis and validation are completed."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insightsList.map((item) => {
            const prio = priorityStyles[item.priority];
            const added = addedToReport.has(item.id);
            return (
              <div key={item.id} className="card p-4.5 card-hover space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${prio.bg}`}>
                      {item.priority.toUpperCase()} PRIORITY
                    </span>
                    <StatusBadge status={prio.badge}>
                      {sectionTitles[item.section]}
                    </StatusBadge>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h3>

                {/* Metrics */}
                {item.metrics && item.metrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {item.metrics.map((m) => (
                      <div key={m.label} className="rounded bg-slate-50 border border-border-subtle p-2">
                        <p className="text-[10px] text-slate-400">{m.label}</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                    Recommended Action
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.recommendation}</p>
                </div>

                {/* Expected Impact */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                    Expected Impact
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.impact}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                  <button className="btn-secondary text-2xs" onClick={() => onNavigate('analytics')}>
                    <BarChart3 size={12} /> View Analysis
                  </button>
                  <button
                    onClick={() => addToReport(item.id)}
                    disabled={added}
                    className="btn-primary text-2xs"
                  >
                    {added ? (
                      <>
                        <CheckSquare size={12} /> Added to Report
                      </>
                    ) : (
                      <>
                        <Plus size={12} /> Add to Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => onNavigate('ai-review')}>
          <span>Continue to AI Financial Review</span> <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
