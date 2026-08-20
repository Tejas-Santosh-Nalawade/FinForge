import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import {
  Database, AlertTriangle, TrendingUp, FileText, ArrowRight,
  BarChart3, CheckCircle2, RefreshCw, Sliders, Image as ImageIcon,
} from 'lucide-react';
import { ChartCard } from '@/components/ui/ChartCard';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  fetchDatasets,
  fetchAuditReport,
  fetchAnalyticsReport,
  fetchForecastReport,
  runEngine,
  getChartUrl,
  DatasetItem,
  EngineAuditReport,
  EngineAnalyticsReport,
  EngineForecastReport,
} from '@/services/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
  onDatasetChange?: (datasetId: string) => void;
}

export function Dashboard({
  onNavigate,
  selectedDataset = 'error_data',
  onDatasetChange,
}: DashboardProps) {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [currentDataset, setCurrentDataset] = useState<string>(selectedDataset);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'interactive' | 'engine_png'>('engine_png');

  const [auditData, setAuditData] = useState<EngineAuditReport | null>(null);
  const [analyticsData, setAnalyticsData] = useState<EngineAnalyticsReport | null>(null);
  const [forecastData, setForecastData] = useState<EngineForecastReport | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (currentDataset) {
      loadDashboardData(currentDataset);
    }
  }, [currentDataset]);

  const loadDatasets = async () => {
    try {
      const list = await fetchDatasets();
      setDatasets(list);
      if (list.length > 0 && !currentDataset) {
        setCurrentDataset(list[0].id);
      }
    } catch (err: any) {
      console.error('Error loading datasets:', err);
    }
  };

  const loadDashboardData = async (datasetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [audit, analytics, forecast] = await Promise.all([
        fetchAuditReport(datasetId).catch(() => null),
        fetchAnalyticsReport(datasetId).catch(() => null),
        fetchForecastReport(datasetId).catch(() => null),
      ]);
      setAuditData(audit);
      setAnalyticsData(analytics);
      setForecastData(forecast);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset details');
    } finally {
      setLoading(false);
    }
  };

  const handleRunEngine = async () => {
    setRunning(true);
    try {
      await runEngine(currentDataset);
      await loadDashboardData(currentDataset);
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleDatasetSelect = (id: string) => {
    setCurrentDataset(id);
    if (onDatasetChange) {
      onDatasetChange(id);
    }
  };

  // Engagement & conclusion details
  const engagement = auditData?.engagement || analyticsData?.engagement || {};
  const conclusion = auditData?.conclusion;
  const passedRules = conclusion?.procedures_passed ?? (auditData?.procedures?.filter((p: any) => p.status === 'PASS').length || 0);
  const totalRules = conclusion?.total_procedures_run ?? (auditData?.procedures?.length || 0);
  const overallStatus = conclusion?.overall_status || 'FLAGGED';

  // Extract analytics metrics
  const analyticsObj = analyticsData?.analytics || {};
  const ratiosList: any[] = analyticsObj.ratios || [];
  const getRatio = (name: string) => ratiosList.find((r: any) => r.name?.toLowerCase().includes(name.toLowerCase()));

  const grossMarginRatio = getRatio('Gross Profit Margin');
  const netMarginPct = analyticsObj.historical_baseline_analytics?.margin_trajectories?.current_net_margin_pct;
  const currentRatio = getRatio('Current Ratio');
  const quickRatio = getRatio('Quick Ratio');
  const cashRunway = analyticsObj.cash_runway_velocity?.cash_runway_months;

  const incomeStmt: any[] = analyticsObj.income_statement || [];
  const revenueRow = incomeStmt.find((r: any) => r.line_item?.toLowerCase().includes('revenue'));
  const netSalesVal = revenueRow ? revenueRow.current_period : null;

  // Chart URLs from API
  const ratioChartUrl = getChartUrl(currentDataset, 'ratios');
  const isChartUrl = getChartUrl(currentDataset, 'income_statement');
  const revenueChartUrl = getChartUrl(currentDataset, 'revenue_trajectory');
  const cashChartUrl = getChartUrl(currentDataset, 'cash_runway');

  // Interactive Recharts data
  const revenueTrend = incomeStmt.map((row: any) => ({
    item: row.line_item?.replace('&', '&').slice(0, 16),
    current: row.current_period || 0,
    prior: row.prior_period || 0,
  }));

  const rawProjections = forecastData?.projections;
  let projList: any[] = [];
  if (Array.isArray(rawProjections)) {
    projList = rawProjections;
  } else if (rawProjections && Array.isArray(rawProjections.projections)) {
    projList = rawProjections.projections;
  }

  const forecastTrend = projList.map((p: any) => ({
    quarter: p.period || p.quarter || '',
    revenue: p.revenue || 0,
    netIncome: p.net_income || 0,
    opex: p.opex || 0,
  }));

  // Audit findings (failed procedures + findings)
  const failedProcedures = (auditData?.procedures || []).filter((p: any) => p.status !== 'PASS');

  // Strategic recommendations
  const sr = forecastData?.strategic_recommendations || {};
  const recList: any[] = (sr as any).risk_mitigation_matrix || (sr as any).recommendations || (sr as any).capital_allocation_policy || [];

  return (
    <div className="animate-fade-in space-y-5">
      {/* Top Controls & Dataset Selector */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 text-white border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Active Deterministic Engine Dataset</span>
              {overallStatus === 'CLEARED' ? (
                <span className="px-2 py-0.5 text-2xs rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  CLEARED ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 text-2xs rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {overallStatus}
                </span>
              )}
            </h2>
            <p className="text-2xs text-slate-300 mt-0.5">
              Select dataset below to inspect live deterministic math tie-outs, analytics, and generated chart plots.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            className="input bg-slate-800 border-slate-700 text-white text-xs font-semibold px-3 py-1.5 focus:ring-accent"
            value={currentDataset}
            onChange={(e) => handleDatasetSelect(e.target.value)}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
            onClick={handleRunEngine}
            disabled={running}
          >
            <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
            <span>{running ? 'Executing Engine...' : 'Re-run Engine'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-accent" />
          <span>Fetching live deterministic data and charts from FastAPI backend...</span>
        </div>
      )}

      {error && (
        <div className="card p-4 bg-red-50 border-red-200 text-red-700 text-xs font-medium">
          ⚠️ API Error: {error}
        </div>
      )}

      {!loading && (
        <>
          {/* Status Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-3.5 card-hover">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Database size={14} />
                </div>
                <div>
                  <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Active Entity</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                    {engagement.client_name || engagement.company_name || currentDataset.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-3.5 card-hover">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center ${
                    passedRules === totalRules && totalRules > 0
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                      : 'bg-amber-50 border border-amber-200 text-amber-600'
                  }`}
                >
                  {passedRules === totalRules && totalRules > 0 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                </div>
                <div>
                  <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Deterministic Tie-Outs</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {passedRules} / {totalRules} Rules Passed
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-3.5 card-hover">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit Margin</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {netMarginPct != null ? `${netMarginPct.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-3.5 card-hover">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Working Paper WP-514</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {overallStatus === 'CLEARED' ? 'Passed & Signed Off' : 'Exceptions Flagged'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Core KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Net Sales / Revenue"
              value={netSalesVal != null ? `$${netSalesVal.toFixed(2)}M` : '$0.00M'}
              suffix="Last Reported Q"
            />
            <KpiCard
              label="Gross Margin"
              value={grossMarginRatio ? `${grossMarginRatio.current_period?.toFixed(1)}%` : 'N/A'}
              suffix="Stage 3 Analytics"
            />
            <KpiCard
              label="Current Ratio"
              value={currentRatio ? `${currentRatio.current_period?.toFixed(2)}x` : 'N/A'}
              suffix="Liquidity Metric"
            />
            <KpiCard
              label="Quick Ratio"
              value={quickRatio ? `${quickRatio.current_period?.toFixed(2)}x` : 'N/A'}
              suffix="Acid Test"
            />
            <KpiCard
              label="Cash Runway"
              value={cashRunway != null ? `${cashRunway.toFixed(1)}` : 'N/A'}
              suffix="Months"
            />
          </div>

          {/* Chart View Toggle Control */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Financial Visualization Views</span>
              <span className="text-2xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                API Endpoint: /api/v1/engine/chart/{currentDataset}/...
              </span>
            </div>

            <div className="inline-flex p-1 rounded-md bg-slate-200 border border-slate-300">
              <button
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'engine_png'
                    ? 'bg-accent text-white shadow-subtle'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                onClick={() => setViewMode('engine_png')}
              >
                <ImageIcon size={13} />
                <span>Deterministic Engine Generated Charts</span>
              </button>
              <button
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'interactive'
                    ? 'bg-accent text-white shadow-subtle'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                onClick={() => setViewMode('interactive')}
              >
                <BarChart3 size={13} />
                <span>Interactive Recharts</span>
              </button>
            </div>
          </div>

          {/* Render Engine Generated Chart PNGs */}
          {viewMode === 'engine_png' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-3 space-y-2 bg-white card-hover">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <span className="text-xs font-bold text-slate-900">8-Quarter Revenue &amp; Profit Trajectory Plot</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Engine Generated PNG
                  </span>
                </div>
                <img
                  src={revenueChartUrl}
                  alt="8-Quarter Revenue Trajectory Chart"
                  className="w-full h-auto rounded border border-slate-200 object-contain shadow-subtle"
                />
              </div>

              <div className="card p-3 space-y-2 bg-white card-hover">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Cash Flow Dynamics &amp; Liquidity Runway Plot</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Engine Generated PNG
                  </span>
                </div>
                <img
                  src={cashChartUrl}
                  alt="Cash Flow Runway Chart"
                  className="w-full h-auto rounded border border-slate-200 object-contain shadow-subtle"
                />
              </div>

              <div className="card p-3 space-y-2 bg-white card-hover">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Financial Ratio Benchmark Dashboard Plot</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Engine Generated PNG
                  </span>
                </div>
                <img
                  src={ratioChartUrl}
                  alt="Financial Ratio Benchmark Chart"
                  className="w-full h-auto rounded border border-slate-200 object-contain shadow-subtle"
                />
              </div>

              <div className="card p-3 space-y-2 bg-white card-hover">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Income Statement YoY Variance Comparison Plot</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Engine Generated PNG
                  </span>
                </div>
                <img
                  src={isChartUrl}
                  alt="Income Statement YoY Variance Chart"
                  className="w-full h-auto rounded border border-slate-200 object-contain shadow-subtle"
                />
              </div>
            </div>
          )}

          {/* Interactive Recharts Mode */}
          {viewMode === 'interactive' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title="Historical Revenue & Profitability Baseline"
                subtitle="Income statement items (Prior vs Current Period)"
                isEmpty={revenueTrend.length === 0}
                emptyTitle="No data available"
                emptyDescription="No quarterly trend data found."
                emptyIcon={BarChart3}
              >
                {revenueTrend.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueTrend.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="item" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip formatter={(v: any) => [`$${v}M`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="prior" name="Prior Period" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="current" name="Current Period" fill="#2563EB" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard
                title="8-Quarter Rolling Revenue Projections"
                subtitle="Deterministic forecasting engine output"
                isEmpty={forecastTrend.length === 0}
                emptyTitle="No forecast generated"
                emptyDescription="Run engine to generate forecast."
                emptyIcon={TrendingUp}
              >
                {forecastTrend.length > 0 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={forecastTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip formatter={(v: any) => `$${v}M`} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" name="Revenue (M)" stroke="#0D9488" fill="#CCFBF1" />
                      <Area type="monotone" dataKey="netIncome" name="Net Income (M)" stroke="#2563EB" fill="#DBEAFE" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          )}

          {/* Bottom row: Critical Audit Findings & Strategic Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Audit Findings */}
            <div className="card p-4.5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <span>Audit &amp; Validation Findings</span>
                </h3>
                <button
                  onClick={() => onNavigate('data-review')}
                  className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
                >
                  View Data Review <ArrowRight size={11} />
                </button>
              </div>

              {failedProcedures.length === 0 ? (
                <div className="p-4 text-center rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  ✓ Zero audit tie-out discrepancies detected for this dataset.
                </div>
              ) : (
                <div className="space-y-2">
                  {failedProcedures.slice(0, 4).map((f: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-border-subtle flex items-start gap-2.5">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-2xs font-bold shrink-0 mt-0.5 bg-red-100 text-red-700"
                      >
                        !
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{f.reference}: {f.procedure || f.name}</p>
                        <p className="text-2xs text-slate-600 mt-0.5 line-clamp-2">{f.issue || f.resolution || 'Validation exception'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategic Planning Recommendations */}
            <div className="card p-4.5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-teal-600" />
                  <span>Strategic Planning Recommendations</span>
                </h3>
                <button
                  onClick={() => onNavigate('forecast')}
                  className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
                >
                  View Forecast <ArrowRight size={11} />
                </button>
              </div>

              {recList.length === 0 ? (
                <div className="p-4 text-center rounded bg-slate-50 text-xs text-slate-500">
                  Run strategic forecasting engine to compute recommendations.
                </div>
              ) : (
                <div className="space-y-2">
                  {recList.slice(0, 4).map((r: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-border-subtle flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-2xs font-bold shrink-0 mt-0.5 bg-teal-100 text-teal-800"
                      >
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{r.pillar || r.risk_factor || r.title}</p>
                        <p className="text-2xs text-slate-600 mt-0.5">{r.target_objective || r.sensitivity || r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
