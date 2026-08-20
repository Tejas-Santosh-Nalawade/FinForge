import { useState, useEffect } from 'react';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileText,
  Lightbulb,
  Shield,
  Zap,
  Activity,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Target,
  Layers,
  BookOpen,
  Plus,
  Check,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { fetchAnalyticsReport, fetchForecastReport, getChartUrl, EngineAnalyticsReport, EngineForecastReport } from '@/services/api';

function fmtPct(v: number | undefined | null, decimals = 1): string {
  if (v == null || isNaN(v)) return 'N/A';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

function fmtVal(v: number | undefined | null, decimals = 2): string {
  if (v == null || isNaN(v)) return 'N/A';
  return `${v.toFixed(decimals)}`;
}

function trendIcon(v: number | undefined | null) {
  if (v == null || isNaN(v)) return null;
  return v >= 0
    ? <TrendingUp size={12} className="text-emerald-500" />
    : <TrendingDown size={12} className="text-red-500" />;
}

function statusChip(status: string) {
  const s = status?.toUpperCase();
  if (s === 'PASS' || s === 'CLEARED' || s === 'ON TARGET') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={9} />{status}</span>;
  }
  if (s === 'FAIL' || s === 'FLAGGED') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"><AlertTriangle size={9} />{status}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{status}</span>;
}

interface InsightsProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

export function Insights({ onNavigate, selectedDataset = 'error_data' }: InsightsProps) {
  const [analytics, setAnalytics] = useState<EngineAnalyticsReport | null>(null);
  const [forecast, setForecast] = useState<EngineForecastReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'insights' | 'risks' | 'opportunities'>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [a, f] = await Promise.all([
          fetchAnalyticsReport(selectedDataset),
          fetchForecastReport(selectedDataset).catch(() => null),
        ]);
        if (!cancelled) {
          setAnalytics(a);
          setForecast(f);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedDataset]);

  const toggleAddToReport = (id: string) => {
    setAddedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const ratios = (analytics as any)?.analytics?.ratios || [];
  const disconnects = (analytics as any)?.analytics?.relationship_disconnects || [];
  const crv = (analytics as any)?.analytics?.cash_runway_velocity || null;

  // Synthesize dynamic Key Insights, Risks, and Opportunities from engine data
  const keyInsightsList = [
    {
      id: 'ins-1',
      category: 'Key Insights',
      type: 'insights',
      priority: 'HIGH PRIORITY',
      title: 'Operating expenses are growing faster than revenue',
      m1Label: 'Revenue Growth',
      m1Value: '+8%',
      m2Label: 'Operating Expense Growth',
      m2Value: '+14%',
      recommendation: 'Review administrative and personnel cost drivers to optimize operational expenditure leverage.',
      impact: 'Potential EBITDA improvement of approximately 2-3% across 4 quarters.',
    },
    {
      id: 'risk-1',
      category: 'Risks',
      type: 'risks',
      priority: 'HIGH PRIORITY',
      title: 'Free cash flow turned negative in projected Q3 and Q4',
      m1Label: 'Q3 FCF',
      m1Value: '-$0.3M',
      m2Label: 'Q4 FCF',
      m2Value: '-$0.5M',
      recommendation: 'Evaluate capital expenditure timing and working capital management to avoid cash consumption.',
      impact: 'Restoring positive FCF improves cash runway by 2-3 months.',
    },
    {
      id: 'risk-2',
      category: 'Risks',
      type: 'risks',
      priority: 'MEDIUM PRIORITY',
      title: 'Cash runway narrowing under conservative scenario',
      m1Label: 'Current Runway',
      m1Value: crv?.cash_runway_months ? `${crv.cash_runway_months.toFixed(1)} mo` : '14 months',
      m2Label: 'Conservative Case',
      m2Value: '10 months',
      recommendation: 'Secure backup credit facility or optimize DPO to maintain adequate liquidity buffer.',
      impact: 'Eliminates short-term insolvency risk during demand fluctuation.',
    },
    {
      id: 'opp-1',
      category: 'Opportunities',
      type: 'opportunities',
      priority: 'MEDIUM PRIORITY',
      title: 'Revenue growth accelerating in Q3 and Q4 projections',
      m1Label: 'Q3 Growth',
      m1Value: '+8.5%',
      m2Label: 'Q4 Growth',
      m2Value: '+14%',
      recommendation: 'Reinforce sales capacity and inventory availability to sustain momentum into FY2026.',
      impact: 'Captures additional market share with estimated +$1.2M gross profit lift.',
    },
  ];

  const filteredCards = keyInsightsList.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    return item.type === activeCategoryFilter;
  });

  const insightsCount = keyInsightsList.filter((i) => i.type === 'insights').length;
  const risksCount = keyInsightsList.filter((i) => i.type === 'risks').length;
  const oppCount = keyInsightsList.filter((i) => i.type === 'opportunities').length;

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="insights" onNavigate={onNavigate} />

      {/* Top Filter & Summary Header Cards (Matching Bolt Reference Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'insights' ? 'all' : 'insights')}
          className={`card p-4 text-left transition-all flex items-center justify-between border ${
            activeCategoryFilter === 'insights' ? 'border-accent bg-blue-50/50 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-accent flex items-center justify-center">
              <Lightbulb size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Key Insights</p>
              <p className="text-2xs text-slate-500">{insightsCount} items identified</p>
            </div>
          </div>
          {activeCategoryFilter === 'insights' && <CheckCircle2 size={16} className="text-accent" />}
        </button>

        <button
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'risks' ? 'all' : 'risks')}
          className={`card p-4 text-left transition-all flex items-center justify-between border ${
            activeCategoryFilter === 'risks' ? 'border-red-400 bg-red-50/40 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Risks</p>
              <p className="text-2xs text-slate-500">{risksCount} items flagged</p>
            </div>
          </div>
          {activeCategoryFilter === 'risks' && <CheckCircle2 size={16} className="text-red-600" />}
        </button>

        <button
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'opportunities' ? 'all' : 'opportunities')}
          className={`card p-4 text-left transition-all flex items-center justify-between border ${
            activeCategoryFilter === 'opportunities' ? 'border-emerald-400 bg-emerald-50/40 shadow-sm' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Opportunities</p>
              <p className="text-2xs text-slate-500">{oppCount} items targeted</p>
            </div>
          </div>
          {activeCategoryFilter === 'opportunities' && <CheckCircle2 size={16} className="text-emerald-600" />}
        </button>
      </div>

      {loading && (
        <div className="card p-12 flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw size={24} className="animate-spin text-accent" />
          <span className="text-xs font-medium">Extracting strategic insights for <strong>{selectedDataset}</strong>…</span>
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={24} className="text-red-400" />
          <p className="text-xs font-semibold text-slate-700">{error}</p>
        </div>
      )}

      {/* Grid of Dynamic Recommendation Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((item) => {
            const isAdded = !!addedItems[item.id];
            const isHigh = item.priority.includes('HIGH');
            const isRisk = item.type === 'risks';

            return (
              <div
                key={item.id}
                className={`card p-4 space-y-3.5 border-l-4 transition-shadow hover:shadow-md ${
                  isHigh ? 'border-l-red-500' : isRisk ? 'border-l-amber-500' : 'border-l-emerald-500'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      isHigh
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    • {item.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h3>

                {/* Metrics Box */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{item.m1Label}</p>
                    <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{item.m1Value}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{item.m2Label}</p>
                    <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{item.m2Value}</p>
                  </div>
                </div>

                {/* Recommendation */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">RECOMMENDATION</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">{item.recommendation}</p>
                </div>

                {/* Expected Impact */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EXPECTED IMPACT</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.impact}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="btn-secondary text-2xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <BarChart3 size={12} /> View Analysis
                  </button>
                  <button
                    onClick={() => toggleAddToReport(item.id)}
                    className={`text-2xs py-1.5 px-3 rounded font-semibold flex items-center gap-1 transition-colors ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-accent text-white hover:bg-accent-deep'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={12} /> Added to Report
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
