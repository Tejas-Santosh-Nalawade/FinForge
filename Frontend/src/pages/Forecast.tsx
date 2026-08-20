import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  ArrowRight, TrendingUp, RefreshCw, CheckCircle2,
  Image as ImageIcon, Shield, Target, Zap, AlertTriangle,
} from "lucide-react";
import { WorkflowIndicator } from "@/components/ui/WorkflowIndicator";
import { KpiCard } from "@/components/ui/KpiCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchForecastReport, getChartUrl } from "@/services/api";

interface ForecastProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

function statusChip(status: string) {
  const s = (status || "").toUpperCase();
  const isOk = s.includes("PASS") || s.includes("APPROVED") || s.includes("HEALTHY") || s.includes("COMPLIANT") || s.includes("CLEARANCE") || s.includes("ADEQUATE");
  return isOk
    ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{status}</span>
    : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{status}</span>;
}

export function Forecast({
  onNavigate,
  selectedDataset = "error_data",
}: ForecastProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchForecastReport(selectedDataset)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDataset]);

  // The API returns either:
  //   { dataset_id, strategic_recommendations, projections: { metadata, projections: [...] } }
  // or for Supabase stored format:
  //   { dataset_id, strategic_recommendations, projections: [{ period, revenue, ... }, ...] }
  const rawProj = data?.projections;
  // Normalise: projections can be null, array, or object with .projections array
  let projArray: any[] = [];
  if (Array.isArray(rawProj)) {
    projArray = rawProj;
  } else if (rawProj && Array.isArray(rawProj.projections)) {
    projArray = rawProj.projections;
  }

  const sr = data?.strategic_recommendations || {};
  const execSummary = (sr as any).executive_summary || null;
  const capPolicy: any[] = (sr as any).capital_allocation_policy || [];
  const risks: any[] = (sr as any).risk_mitigation_matrix || [];
  const recs: any[] = (sr as any).recommendations || [];

  const revenueChartUrl = getChartUrl(selectedDataset, "revenue_trajectory");
  const cashChartUrl = getChartUrl(selectedDataset, "cash_runway");

  // Build Recharts-friendly data
  const chartData = projArray.map((p: any) => ({
    quarter: p.period || p.quarter || "",
    revenue: parseFloat((p.revenue ?? 0).toFixed(1)),
    grossProfit: parseFloat((p.gross_profit ?? 0).toFixed(1)),
    opex: parseFloat((p.opex ?? 0).toFixed(1)),
    operatingIncome: parseFloat((p.operating_income ?? 0).toFixed(1)),
    netIncome: parseFloat((p.net_income ?? 0).toFixed(1)),
    cashFlow: parseFloat((p.operating_cash_flow ?? 0).toFixed(1)),
    fcf: parseFloat((p.free_cash_flow ?? 0).toFixed(1)),
    endingCash: parseFloat((p.ending_cash ?? 0).toFixed(1)),
  }));

  const lastQ = chartData[chartData.length - 1];
  const q8Revenue = lastQ?.revenue ?? 0;
  const q8NetIncome = lastQ?.netIncome ?? 0;
  const q8CashFlow = lastQ?.cashFlow ?? 0;
  const totalRevenue8Q = parseFloat(projArray.reduce((s: number, p: any) => s + (p.revenue ?? 0), 0).toFixed(1));

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="forecast" onNavigate={onNavigate} />

      {loading && (
        <div className="card p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw size={15} className="animate-spin text-accent" />
          <span>Executing 4Q &amp; 8Q Rolling Forecast Engine for <strong>{selectedDataset}</strong>…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Projections Horizon" value={`${chartData.length} Quarters`} suffix="Rolling Forecast" />
            <KpiCard label="Projected Q8 Revenue" value={q8Revenue > 0 ? `${q8Revenue}M` : "$0M"} suffix="Quarter 8 Target" />
            <KpiCard label="Projected Q8 Net Income" value={q8NetIncome > 0 ? `${q8NetIncome}M` : "$0M"} suffix="Quarter 8 Bottom-Line" />
            <KpiCard label="Projected Q8 Op Cash Flow" value={q8CashFlow > 0 ? `${q8CashFlow}M` : "$0M"} suffix="Cash Generation" />
          </div>

          {/* Executive Summary (from strategic_recommendations) */}
          {execSummary && (
            <div className="card p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-teal-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">8-Quarter Executive Forecast Summary</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Company", value: execSummary.company },
                  { label: "8Q Total Revenue", value: execSummary.total_projected_revenue_8q ? `${execSummary.currency} ${execSummary.total_projected_revenue_8q}M` : `${totalRevenue8Q}M` },
                  { label: "8Q Net Income", value: execSummary.total_projected_net_income_8q ? `${execSummary.currency} ${execSummary.total_projected_net_income_8q}M` : "N/A" },
                  { label: "Free Cash Flow (8Q)", value: execSummary.total_free_cash_flow_8q ? `${execSummary.currency} ${execSummary.total_free_cash_flow_8q}M` : "N/A" },
                  { label: "Ending Cash (8Q)", value: execSummary.ending_cash_reserves_8q ? `${execSummary.currency} ${execSummary.ending_cash_reserves_8q}M` : "N/A" },
                  { label: "Covenant Status", value: execSummary.debt_covenant_headroom_status },
                  { label: "Cash Buffer", value: execSummary.cash_buffer_adequacy },
                  { label: "Horizon", value: execSummary.planning_horizon },
                ].map((d) => (
                  <div key={d.label} className="bg-white/10 rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{d.label}</p>
                    <p className="text-xs font-bold text-white mt-0.5 leading-tight">{d.value ?? "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engine PNG Charts */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ImageIcon size={15} className="text-teal-600" />
              <span>Deterministic Forecasting Engine Visualizations</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { url: revenueChartUrl, label: "8-Quarter Revenue & Profit Trajectory Plot", key: "rev" },
                { url: cashChartUrl, label: "Cash Flow Dynamics & Liquidity Runway Plot", key: "cash" },
              ].map(({ url, label, key }) => (
                <div key={key} className="card p-3 space-y-2 bg-white card-hover">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-bold text-slate-900">{label}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Engine PNG</span>
                  </div>
                  {imgErrors[key] ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded text-xs gap-1">
                      <ImageIcon size={22} /><p>Run engine to generate chart</p>
                    </div>
                  ) : (
                    <img src={url} alt={label}
                      className="w-full h-auto rounded border border-slate-200 object-contain shadow-subtle"
                      onError={() => setImgErrors((prev) => ({ ...prev, [key]: true }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main 8Q Revenue Area Chart */}
          <ChartCard
            title="8-Quarter Rolling Revenue & Operating Projections"
            subtitle="Deterministic forecasting engine output with growth trends"
            isEmpty={chartData.length === 0}
            emptyTitle="No forecast available"
            emptyDescription="Process dataset to generate forecasting model."
            emptyIcon={TrendingUp}
          >
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}M`} />
                  <Tooltip formatter={(v: any) => `${v}M`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (M)" stroke="#0D9488" strokeWidth={2.5} fill="#CCFBF1" />
                  <Area type="monotone" dataKey="grossProfit" name="Gross Profit (M)" stroke="#16A34A" strokeWidth={1.5} fill="#DCFCE7" />
                  <Area type="monotone" dataKey="netIncome" name="Net Income (M)" stroke="#2563EB" strokeWidth={1.5} fill="#DBEAFE" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* OPEX & Cash Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Projected Operating Expenses (OPEX)"
              subtitle="Cost structure breakdown over 8 quarters"
              isEmpty={chartData.length === 0}
              emptyTitle="No data"
              emptyDescription="No OPEX data available."
              emptyIcon={TrendingUp}
            >
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}M`} />
                    <Tooltip formatter={(v: any) => `${v}M`} />
                    <Bar dataKey="opex" name="OPEX (M)" fill="#D97706" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Projected Operating Cash Flow"
              subtitle="Cash generation trajectory"
              isEmpty={chartData.length === 0}
              emptyTitle="No data"
              emptyDescription="No cash flow data available."
              emptyIcon={TrendingUp}
            >
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}M`} />
                    <Tooltip formatter={(v: any) => `${v}M`} />
                    <Bar dataKey="cashFlow" name="Operating CF (M)" fill="#16A34A" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="fcf" name="Free Cash Flow (M)" fill="#0D9488" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Capital Allocation Policy */}
          {capPolicy.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle bg-slate-50 flex items-center gap-2">
                <Target size={13} className="text-accent" />
                <span className="text-xs font-bold text-slate-800">Capital Allocation Policy</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {capPolicy.map((pol: any, i: number) => (
                  <div key={i} className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-teal-500" />
                      <span className="text-xs font-bold text-slate-800">{pol.pillar}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{pol.target_objective}</p>
                    <p className="text-[10px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded">{pol.allocation_rule}</p>
                    {statusChip(pol.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Mitigation Matrix */}
          {risks.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle bg-red-50 flex items-center gap-2">
                <Shield size={13} className="text-red-500" />
                <span className="text-xs font-bold text-slate-800">Risk Mitigation Matrix</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">{risks.length} Risks</span>
              </div>
              <div className="divide-y divide-slate-50">
                {risks.map((r: any, i: number) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-4">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-900">{r.risk_factor}</p>
                      <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-700">Sensitivity:</span> {r.sensitivity}</p>
                      <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-700">Mitigation:</span> {r.mitigation_strategy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Planning Recommendations */}
          <div className="card p-4 space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-600" />
                <span>Deterministic Strategic Planning Recommendations</span>
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5">
                Calculated strategic actions derived from forecasting engine ratios &amp; liquidity metrics.
              </p>
            </div>
            {recs.length === 0 && capPolicy.length === 0 && risks.length === 0 ? (
              <div className="p-4 text-center rounded bg-slate-50 text-xs text-slate-500">
                No strategic recommendations generated for this dataset.
              </div>
            ) : recs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recs.map((r: any, idx: number) => (
                  <div key={idx} className={`card p-3 bg-slate-50 border-l-4 ${r.priority === "HIGH" ? "border-red-500" : r.priority === "MEDIUM" ? "border-amber-400" : "border-emerald-400"} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{r.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.priority === "HIGH" ? "bg-red-50 text-red-700" : r.priority === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{r.action}</p>
                    <p className="text-2xs text-slate-400">Impact: {r.expected_impact}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 text-center">See Capital Allocation &amp; Risk Matrix above for strategic details.</p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => onNavigate("wp514")}>
          <span>Continue to WP-514 Workpaper</span> <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
