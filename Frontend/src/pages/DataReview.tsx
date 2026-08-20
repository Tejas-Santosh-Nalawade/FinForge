import { useState, useEffect } from 'react';
import {
  X,
  FileSearch,
  Check,
  Ban,
  Eye,
  ArrowRight,
  AlertCircle,
  ClipboardCheck,
  RefreshCw,
  Lightbulb,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar, FilterSelect, SearchInput } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchAuditReport, fetchForecastReport, EngineAuditProcedure } from '@/services/api';

interface DataReviewProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

interface ProcedureUIItem {
  id: string;
  area: string;
  field: string;
  issue: string;
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'Open' | 'Resolved' | 'Waived';
  calculated?: string;
  reported?: string;
  difference?: string;
  explanation?: string;
  recommendation?: string;
  expectedImpact?: string;
}

export function DataReview({
  onNavigate,
  selectedDataset = 'error_data',
}: DataReviewProps) {
  const [procedures, setProcedures] = useState<ProcedureUIItem[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [selected, setSelected] = useState<ProcedureUIItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');

  useEffect(() => {
    loadAuditProcedures(selectedDataset);
  }, [selectedDataset]);

  const loadAuditProcedures = async (datasetId: string) => {
    setLoading(true);
    try {
      const [report, forecast] = await Promise.all([
        fetchAuditReport(datasetId),
        fetchForecastReport(datasetId).catch(() => null),
      ]);

      setForecastData(forecast);

      const items: ProcedureUIItem[] = (report.procedures || []).map((p: EngineAuditProcedure, idx: number) => {
        const isPass = p.status === 'PASS';
        let sev: 'critical' | 'warning' | 'info' = isPass ? 'info' : 'critical';
        if (!isPass && (p.reference.startsWith('PY_') || p.reference.startsWith('NOTE_') || p.reference.startsWith('REL_'))) {
          sev = 'warning';
        }

        const procTitle = p.procedure || p.name || p.description || `Procedure ${p.reference}`;
        const issueStr = p.issue || p.details || p.note || p.resolution || (isPass ? 'Reconciled & Tied Out' : 'Audit exception flagged');

        let calc = p.calculated_value !== undefined ? String(p.calculated_value) : undefined;
        let rep = p.reported_value !== undefined ? String(p.reported_value) : undefined;
        let diff = p.variance !== undefined && p.variance !== 0 ? `$${p.variance.toLocaleString()}` : undefined;

        if (p.issue && p.issue.includes('Discrepancy of $')) {
          try {
            const parts = p.issue.split(':');
            const discVal = parts[0].replace('Discrepancy of $', '').trim();
            if (!diff && discVal) diff = `$${discVal}`;
            if (parts.length > 1) {
              const subparts = parts[1].split(',');
              for (const sp of subparts) {
                if (sp.includes('Expected $') && !calc) calc = sp.replace('Expected $', '').trim();
                if (sp.includes('Actual $') && !rep) rep = sp.replace('Actual $', '').trim();
              }
            }
          } catch (e) {
            console.debug('Error parsing issue string:', e);
          }
        }

        // Recommendation & Expected Impact synthesis for each error
        let rec = p.resolution || (isPass ? 'Zero action required. Tied out to source.' : 'Investigate source extraction, post trial balance adjustment, and re-verify equation equilibrium.');
        if (rec.startsWith('Audit Action:')) {
          rec = rec.replace('Audit Action:', '').trim();
        }

        let impact = isPass
          ? 'Zero financial statement variance. Cleared for assurance.'
          : diff
          ? `Direct financial statement mismatch of ${diff}. Creates potential trial balance misstatement.`
          : 'High risk of mathematical imbalance across lead schedules.';

        return {
          id: p.reference || `PROC-${idx + 1}`,
          area: p.category || (p.reference.includes('BS') ? 'Balance Sheet' : p.reference.includes('IS') ? 'Income Statement' : 'Mathematical Accuracy'),
          field: procTitle,
          issue: procTitle,
          rule: p.reference,
          severity: sev,
          status: isPass ? 'Resolved' : 'Open',
          calculated: calc,
          reported: rep,
          difference: diff,
          explanation: issueStr,
          recommendation: rec,
          expectedImpact: impact,
        };
      });
      setProcedures(items);
    } catch (err: any) {
      console.error('Error fetching audit procedures:', err);
    } finally {
      setLoading(false);
    }
  };

  const areas = ['All', ...Array.from(new Set(procedures.map((e) => e.area)))];

  const filtered = procedures.filter((e) => {
    const matchSearch =
      e.issue.toLowerCase().includes(search.toLowerCase()) ||
      e.area.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchSev = sevFilter === 'All' || e.severity === sevFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchArea = areaFilter === 'All' || e.area === areaFilter;
    return matchSearch && matchSev && matchStatus && matchArea;
  });

  const updateStatus = (id: string, newStatus: 'Resolved' | 'Waived') => {
    setProcedures((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)));
    setSelected((prev) => (prev?.id === id ? { ...prev, status: newStatus } : prev));
  };

  const criticalCount = procedures.filter((e) => e.severity === 'critical' && e.status === 'Open').length;
  const warningCount = procedures.filter((e) => e.severity === 'warning' && e.status === 'Open').length;
  const passedCount = procedures.filter((e) => e.status === 'Resolved').length;

  const strategicRecommendations = forecastData?.strategic_recommendations?.recommendations || [];
  const riskMatrix = forecastData?.strategic_recommendations?.risk_mitigation_matrix || [];
  const capAllocation = forecastData?.strategic_recommendations?.capital_allocation_policy || [];

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="review" onNavigate={onNavigate} />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Deterministic Rules Run"
          value={procedures.length > 0 ? String(procedures.length) : '0'}
        />
        <KpiCard
          label="Critical Failures"
          value={String(criticalCount)}
          accent={criticalCount > 0}
        />
        <KpiCard
          label="Warnings & Flags"
          value={String(warningCount)}
        />
        <KpiCard
          label="Passed Tie-Out Rules"
          value={String(passedCount)}
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search procedure name, rule reference, or category..."
          disabled={procedures.length === 0}
        />
        <FilterSelect
          label="Severity"
          value={sevFilter}
          options={['All', 'Critical', 'Warning', 'Info']}
          onChange={setSevFilter}
          disabled={procedures.length === 0}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={['All', 'Open', 'Resolved', 'Waived']}
          onChange={setStatusFilter}
          disabled={procedures.length === 0}
        />
        <FilterSelect
          label="Area"
          value={areaFilter}
          options={areas}
          onChange={setAreaFilter}
          disabled={procedures.length === 0}
        />
      </FilterBar>

      {/* Procedures Table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-slate-50">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Deterministic Audit Procedures & Tie-Out Checks</span>
            {loading && <RefreshCw size={12} className="animate-spin text-accent" />}
          </h3>
          <span className="text-2xs text-slate-400 font-medium font-mono">
            {filtered.length} {filtered.length === 1 ? 'rule' : 'rules'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle">
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Rule ID</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Category</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Procedure Description</th>
                <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Recommendation &amp; Expected Impact</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Variance</th>
                <th className="px-4 py-2.5 text-center font-semibold text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-500">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No validation procedures found"
                      description="Ensure the backend deterministic engine has been executed."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((proc) => {
                  const isExpanded = expandedId === proc.id;
                  const isFailed = proc.status === 'Open';

                  return (
                    <tr
                      key={proc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFailed ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-accent text-2xs font-bold align-top">
                        {proc.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 text-2xs align-top">
                        {proc.area}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-slate-900 leading-snug">{proc.issue}</p>
                        {proc.explanation && proc.explanation !== proc.issue && (
                          <p className="text-2xs text-slate-500 font-mono mt-1">{proc.explanation}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top space-y-1 max-w-sm">
                        <div className="flex items-start gap-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-accent border border-blue-200 shrink-0 mt-0.5">REC</span>
                          <span className="text-2xs text-slate-700 font-medium leading-tight">{proc.recommendation}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${isFailed ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>IMPACT</span>
                          <span className="text-2xs text-slate-600 leading-tight">{proc.expectedImpact}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono align-top">
                        {proc.difference ? (
                          <span className="text-red-600 font-bold">{proc.difference}</span>
                        ) : (
                          <span className="text-slate-400">$0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        <StatusBadge status={proc.status === 'Open' ? 'critical' : proc.status === 'Waived' ? 'faint' : 'success'}>
                          {proc.status === 'Open' ? 'FAILED' : proc.status.toUpperCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          onClick={() => setSelected(proc)}
                          className="text-slate-500 hover:text-accent p-1.5 rounded hover:bg-slate-100 transition-colors inline-flex items-center gap-1 text-2xs font-semibold"
                        >
                          <Eye size={14} /> <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Planning Recommendations Panel directly on Data Review */}
      {(strategicRecommendations.length > 0 || riskMatrix.length > 0 || capAllocation.length > 0) && (
        <div className="card p-4 space-y-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Lightbulb size={16} className="text-teal-400" />
              <span>Deterministic Strategic Planning &amp; Remediation Roadmap</span>
            </h3>
            <span className="text-2xs text-teal-300 font-semibold bg-teal-900/50 px-2 py-0.5 rounded border border-teal-500/30">
              Engine Planning Output
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskMatrix.map((r: any, idx: number) => (
              <div key={idx} className="bg-white/10 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Shield size={13} className="text-red-400" /> {r.risk_factor}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">RISK</span>
                </div>
                <p className="text-2xs text-slate-300"><strong className="text-white">Sensitivity:</strong> {r.sensitivity}</p>
                <p className="text-2xs text-emerald-300"><strong className="text-white">Mitigation Strategy:</strong> {r.mitigation_strategy}</p>
              </div>
            ))}

            {capAllocation.map((pol: any, idx: number) => (
              <div key={`cap-${idx}`} className="bg-white/10 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <TrendingUp size={13} className="text-teal-400" /> {pol.pillar}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/30">POLICY</span>
                </div>
                <p className="text-2xs text-slate-300"><strong className="text-white">Rule:</strong> {pol.allocation_rule}</p>
                <p className="text-2xs text-slate-300"><strong className="text-white">Objective:</strong> {pol.target_objective}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-2xs text-slate-400">
          {procedures.length > 0
            ? `${passedCount} of ${procedures.length} deterministic rules passed`
            : '0 rules'}
        </div>
        <button className="btn-primary" onClick={() => onNavigate('analytics')}>
          <span>Continue to Financial Analytics</span> <ArrowRight size={13} />
        </button>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <ExceptionDrawer
          procedure={selected}
          onClose={() => setSelected(null)}
          onAccept={() => updateStatus(selected.id, 'Resolved')}
          onWaive={() => updateStatus(selected.id, 'Waived')}
        />
      )}
    </div>
  );
}

interface ExceptionDrawerProps {
  procedure: ProcedureUIItem;
  onClose: () => void;
  onAccept: () => void;
  onWaive: () => void;
}

function ExceptionDrawer({ procedure, onClose, onAccept, onWaive }: ExceptionDrawerProps) {
  const isFailed = procedure.status === 'Open';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white border-l border-border-subtle z-50 animate-slide-in-right overflow-y-auto shadow-dropdown">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle sticky top-0 bg-slate-50 z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Deterministic Procedure Rule Inspection
            </h3>
            <p className="text-2xs text-slate-400 font-mono mt-0.5">REF: #{procedure.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <p className="kpi-label mb-1">Procedure Description</p>
            <p className="font-semibold text-slate-900 leading-snug">{procedure.issue}</p>
          </div>

          <div>
            <p className="kpi-label mb-1">Audit Category</p>
            <div className="p-2.5 rounded bg-slate-50 border border-border-subtle font-mono text-accent text-2xs">
              {procedure.area}
            </div>
          </div>

          {(procedure.calculated || procedure.reported || procedure.difference) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-2.5 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">Calculated (Expected)</p>
                <p className="font-semibold text-slate-800 font-mono">{procedure.calculated || '—'}</p>
              </div>
              <div className="card p-2.5 text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">Reported (Actual)</p>
                <p className="font-semibold text-slate-800 font-mono">{procedure.reported || '—'}</p>
              </div>
              <div className="card p-2.5 text-center border-red-200 bg-red-50/50">
                <p className="text-[10px] text-red-500 mb-0.5">Variance</p>
                <p className="font-semibold text-status-critical font-mono">{procedure.difference || '—'}</p>
              </div>
            </div>
          )}

          {/* Dedicated Recommendation Card */}
          <div className="card p-3 bg-blue-50/60 border-blue-200 space-y-1">
            <div className="flex items-center gap-1.5">
              <Lightbulb size={14} className="text-accent" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">RECOMMENDATION</span>
            </div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">{procedure.recommendation}</p>
          </div>

          {/* Dedicated Expected Impact Card */}
          <div className={`card p-3 space-y-1 ${isFailed ? 'bg-red-50/60 border-red-200' : 'bg-emerald-50/60 border-emerald-200'}`}>
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} className={isFailed ? 'text-red-600' : 'text-emerald-600'} />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">EXPECTED IMPACT</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed">{procedure.expectedImpact}</p>
          </div>

          {procedure.explanation && (
            <div>
              <p className="kpi-label mb-1">Deterministic Formula &amp; Discrepancy Text</p>
              <div className="flex gap-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-mono text-2xs">
                <AlertCircle size={15} className="text-accent shrink-0 mt-0.5" />
                <p>{procedure.explanation}</p>
              </div>
            </div>
          )}

          <div>
            <p className="kpi-label mb-1">Rule Verification Status</p>
            <StatusBadge status={procedure.status === 'Open' ? 'critical' : 'success'} size="md">
              {procedure.status === 'Open' ? 'FAILED' : procedure.status.toUpperCase()}
            </StatusBadge>
          </div>

          <div className="pt-3 border-t border-border-subtle flex gap-2">
            <button
              onClick={onAccept}
              className="btn-secondary flex-1"
              disabled={procedure.status === 'Resolved'}
            >
              <Check size={13} /> Mark Resolved
            </button>
            <button
              onClick={onWaive}
              className="btn-secondary flex-1"
              disabled={procedure.status === 'Waived'}
            >
              <Ban size={13} /> Waive Rule
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
