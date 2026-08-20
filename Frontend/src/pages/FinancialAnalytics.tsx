import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  ArrowRight, BarChart3, TrendingUp, RefreshCw, Image as ImageIcon,
  CheckCircle2, AlertTriangle, Activity, Layers, Zap,
} from "lucide-react";
import { WorkflowIndicator } from "@/components/ui/WorkflowIndicator";
import { KpiCard } from "@/components/ui/KpiCard";
import { ChartCard } from "@/components/ui/ChartCard";
import { fetchAnalyticsReport, getChartUrl } from "@/services/api";

interface FinancialAnalyticsProps {
  onNavigate: (page: string) => void;
  selectedDataset?: string;
}

function statusBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PASS" || s === "HEALTHY" || s === "CLEARED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={9} />{status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
      <AlertTriangle size={9} />{status}
    </span>
  );
}

export function FinancialAnalytics({
  onNavigate,
  selectedDataset = "error_data",
}: FinancialAnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAnalyticsReport(selectedDataset)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDataset]);

  const analytics = (data as any)?.analytics || {};
  const ratiosArray: any[] = analytics.ratios || [];
  const incomeStmt: any[] = analytics.income_statement || [];
  const balanceSheet: any[] = analytics.balance_sheet || [];
  const disconnects: any[] = analytics.relationship_disconnects || [];
  const bva = analytics.bva_attainment || null;
  const crv = analytics.cash_runway_velocity || null;
  const hist = analytics.historical_baseline_analytics || null;

  // Derive KPI values from ratios array
  const getRatio = (name: string) =>
    ratiosArray.find((r: any) => r.name?.toLowerCase().includes(name.toLowerCase()));

  const grossMargin = getRatio("Gross Profit Margin");
  const opMargin = getRatio("Operating Profit Margin");
  const netMarginPct = hist?.margin_trajectories?.current_net_margin_pct;
  const currentRatio = getRatio("Current Ratio");
  const quickRatio = getRatio("Quick Ratio");
  const debtEquity = getRatio("Debt-to-Equity");
  const interestCoverage = getRatio("Interest Coverage");

  // Group ratios by category
  const ratiosByCategory: Record<string, any[]> = {};
  ratiosArray.forEach((r) => {
    const cat = r.category || "Other";
    if (!ratiosByCategory[cat]) ratiosByCategory[cat] = [];
    ratiosByCategory[cat].push(r);
  });

  // Build chart data from income statement for Recharts
  const incomeChartData = incomeStmt.map((row: any) => ({
    name: row.line_item?.replace("&", "&").slice(0, 18),
    prior: parseFloat(row.prior_period?.toFixed(1) ?? "0"),
    current: parseFloat(row.current_period?.toFixed(1) ?? "0"),
    variancePct: parseFloat(row.variance_pct?.toFixed(1) ?? "0"),
  }));

  const marginData = hist
    ? [
        {
          metric: "Gross Margin",
          prior: hist.margin_trajectories?.prior_gross_margin_pct ?? 0,
          current: hist.margin_trajectories?.current_gross_margin_pct ?? 0,
        },
        {
          metric: "Op Margin",
          prior: hist.margin_trajectories?.prior_operating_margin_pct ?? 0,
          current: hist.margin_trajectories?.current_operating_margin_pct ?? 0,
        },
        {
          metric: "Net Margin",
          prior: hist.margin_trajectories?.prior_net_margin_pct ?? 0,
          current: hist.margin_trajectories?.current_net_margin_pct ?? 0,
        },
      ]
    : [];

  const ratioChartUrl = getChartUrl(selectedDataset, "ratios");
  const isChartUrl = getChartUrl(selectedDataset, "income_statement");

  const fmt = (v: number | null | undefined, suffix = "") =>
    v != null ? `${v.toFixed(2)}${suffix}` : "N/A";

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="analytics" onNavigate={onNavigate} />

      {loading && (
        <div className="card p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw size={15} className="animate-spin text-accent" />
          <span>Loading Stage 3 Financial Analytics & Ratio Engine data for <strong>{selectedDataset}</strong>…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Gross Margin" value={grossMargin ? `${grossMargin.current_period?.toFixed(1)}%` : "N/A"} suffix="Profitability" />
            <KpiCard label="Net Profit Margin" value={netMarginPct != null ? `${netMarginPct.toFixed(1)}%` : "N/A"} suffix="Profitability" />
            <KpiCard label="Current Ratio" value={currentRatio ? `${currentRatio.current_period?.toFixed(2)}x` : "N/A"} suffix="Liquidity" />
            <KpiCard label="Quick Ratio" value={quickRatio ? `${quickRatio.current_period?.toFixed(2)}x` : "N/A"} suffix="Acid Test" />
            <KpiCard label="Debt-to-Equity" value={debtEquity ? `${debtEquity.current_period?.toFixed(2)}x` : "N/A"} suffix="Leverage" />
            <KpiCard label="Interest Coverage" value={interestCoverage ? `${interestCoverage.current_period?.toFixed(2)}x` : "N/A"} suffix="Solvency" />
          </div>

          {/* Engine PNG Charts */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ImageIcon size={15} className="text-accent" />
              <span>Deterministic Engine Generated Executive Analytics Visualizations</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { url: ratioChartUrl, label: "Financial Ratio Benchmark Dashboard Plot", key: "ratios" },
                { url: isChartUrl, label: "Income Statement YoY Variance Comparison Plot", key: "is" },
              ].map(({ url, label, key }) => (
                <div key={key} className="card p-3 space-y-2 bg-white card-hover">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                    <span className="text-xs font-bold text-slate-900">{label}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Engine PNG</span>
                  </div>
                  {imgErrors[key] ? (
                    <div className="h-40 flex items-center justify-center text-slate-400 bg-slate-50 rounded text-xs text-center space-y-1 flex-col">
                      <ImageIcon size={22} />
                      <p>Run engine to generate chart</p>
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

          {/* Historical Revenue & Income Trends (Recharts from API) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Historical Revenue & Gross Profit Baseline"
              subtitle="Ingested income statement prior vs current"
              isEmpty={incomeChartData.length === 0}
              emptyTitle="No data available"
              emptyDescription="No revenue baseline found."
              emptyIcon={BarChart3}
            >
              {incomeChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={incomeChartData.slice(0, 6)} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}M`} />
                    <Tooltip formatter={(v: any) => `${v}M`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="prior" name="Prior Period" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="current" name="Current Period" fill="#2563EB" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Operating Income & Net Income Trends"
              subtitle="Stage 3 Financial Analytics — margin trajectories"
              isEmpty={marginData.length === 0}
              emptyTitle="No EBITDA data available"
              emptyDescription="No operating trend data found."
              emptyIcon={TrendingUp}
            >
              {marginData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={marginData} margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="metric" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="prior" name="Prior Margin %" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="current" name="Current Margin %" fill="#0D9488" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Ratio Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {["Profitability", "Liquidity", "Leverage", "Activity", "Solvency"].map((cat) => {
              const items = ratiosByCategory[cat] || [];
              return (
                <div key={cat} className="card p-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 border-b pb-1.5 border-slate-200">
                    {cat} Ratios
                  </h4>
                  {items.length === 0 ? (
                    <p className="text-[10px] text-slate-400">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((r: any) => (
                        <div key={r.name} className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 truncate pr-1">{r.name?.replace("Ratio", "").trim()}</span>
                            <span className="text-xs font-bold text-slate-900">{r.formatted_value || r.current_period}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {statusBadge(r.status || "PASS")}
                            <span className="text-[9px] text-slate-400">{r.benchmark}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BVA Attainment Panel */}
          {bva && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Layers size={13} className="text-accent" />
                <span className="text-xs font-bold text-slate-800">Budget vs Actual (BVA) Attainment</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Line Item", "Actual", "Budget", "Variance $", "Attainment %", "Status"].map((h) => (
                        <th key={h} className={`px-4 py-2 font-semibold text-slate-500 ${h === "Line Item" ? "text-left" : h === "Status" ? "text-center" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(bva.bva_line_items || []).map((li: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-800">{li.line_item}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-700">{li.actual_amount?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono text-slate-500">{li.budget_amount?.toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right font-mono font-semibold ${li.dollar_variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>{li.dollar_variance?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">{li.attainment_pct?.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-center">{statusBadge(li.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cash Runway Velocity */}
          {crv && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={13} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Cash Runway Velocity</span>
                {crv.runway_alert_triggered
                  ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">⚠ Alert</span>
                  : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ {crv.runway_guardrail_status}</span>
                }
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Cash Reserves", value: `${crv.total_cash_reserves?.toFixed(1)}M` },
                  { label: "Operating CF (TTM)", value: `${crv.trailing_operating_cash_flow?.toFixed(1)}M` },
                  { label: "Cash Runway", value: `${crv.cash_runway_months?.toFixed(1)} mo` },
                  { label: "CCC Days", value: `${crv.cash_conversion_cycle_days} days` },
                ].map((d) => (
                  <div key={d.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{d.label}</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{d.value ?? "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relationship Disconnects */}
          {disconnects.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Activity size={13} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-800">Relationship Disconnect Rules (REL_01–REL_06)</span>
              </div>
              <div className="divide-y divide-slate-50">
                {disconnects.map((r: any, i: number) => (
                  <div key={i} className={`px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 ${r.status !== "PASS" ? "bg-red-50/20" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-slate-400">{r.rule_id}</span>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{r.rule_name}</p>
                      </div>
                      <p className="text-[10px] text-slate-500">{r.audit_implication}</p>
                    </div>
                    <div className="flex-shrink-0">{statusBadge(r.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => onNavigate("forecast")}>
          <span>Continue to Rolling Forecast</span> <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
