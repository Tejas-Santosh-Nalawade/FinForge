import { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ArrowRight, Settings2, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { Modal } from '@/components/ui/Modal';
import {
  ForecastDriver,
  ForecastPoint,
  ScenarioKey,
  ScenarioMetricSet,
} from '@/types/financial';

const scenarioTabs: { key: ScenarioKey; label: string }[] = [
  { key: 'base', label: 'Base Case' },
  { key: 'optimistic', label: 'Optimistic Case' },
  { key: 'conservative', label: 'Conservative Case' },
];

const defaultDrivers: ForecastDriver[] = [
  { name: 'Sales Volume Growth', value: '—', type: 'neutral', description: 'Assumed organic volume expansion' },
  { name: 'Pricing Adjustment', value: '—', type: 'neutral', description: 'Realized price increases across product lines' },
  { name: 'Headcount Additions', value: '—', type: 'neutral', description: 'Planned strategic hiring headcount' },
  { name: 'Operating Cost Inflation', value: '—', type: 'neutral', description: 'General administrative and vendor inflation' },
  { name: 'Interest Rate Assumption', value: '—', type: 'neutral', description: 'Effective debt borrowing rate' },
];

const defaultScenarios: Record<ScenarioKey, ScenarioMetricSet> = {
  base: {
    revenue: 'No data',
    ebitda: 'No data',
    netIncome: 'No data',
    cash: 'No data',
    runway: 'No data',
    description: 'Base Case projections will be calculated based on historical trend continuation and baseline operating assumptions.',
  },
  optimistic: {
    revenue: 'No data',
    ebitda: 'No data',
    netIncome: 'No data',
    cash: 'No data',
    runway: 'No data',
    description: 'Optimistic Case incorporates upside driver scenarios, revenue acceleration, and efficiency gains.',
  },
  conservative: {
    revenue: 'No data',
    ebitda: 'No data',
    netIncome: 'No data',
    cash: 'No data',
    runway: 'No data',
    description: 'Conservative Case stresses revenue growth, models cost headwinds, and evaluates liquidity buffers.',
  },
};

interface ForecastProps {
  onNavigate: (page: string) => void;
  forecastChartData?: ForecastPoint[];
  drivers?: ForecastDriver[];
  scenarios?: Record<ScenarioKey, ScenarioMetricSet>;
}

export function Forecast({
  onNavigate,
  forecastChartData = [],
  drivers = defaultDrivers,
  scenarios = defaultScenarios,
}: ForecastProps) {
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const [driversOpen, setDriversOpen] = useState(false);

  const current = scenarios[scenario] || defaultScenarios[scenario];

  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="forecast" onNavigate={onNavigate} />

      {/* Main Forecast Chart */}
      <ChartCard
        title="Actual vs Forecast Projection"
        subtitle="Historical periods vs forward-looking forecast with confidence intervals"
        action={
          <button className="btn-secondary" onClick={() => setDriversOpen(true)}>
            <SlidersHorizontal size={13} /> <span>Adjust Drivers</span>
          </button>
        }
        isEmpty={forecastChartData.length === 0}
        emptyTitle="No forecast available"
        emptyDescription="Process historical financial data and forecasting assumptions to generate a forecast model."
        emptyIcon={TrendingUp}
      >
        {forecastChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
              <Tooltip formatter={(v: any) => (v !== null ? `$${v}M` : '—')} />
              <ReferenceLine x="Q4" stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'Forecast →', position: 'top', fill: '#64748B', fontSize: 11 }} />
              <Area type="monotone" dataKey="high" stroke="none" fill="#CCFBF1" name="Confidence High" />
              <Area type="monotone" dataKey="low" stroke="none" fill="#FFFFFF" name="Confidence Low" />
              <Line type="monotone" dataKey="actual" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="forecast" stroke="#0D9488" strokeWidth={2.5} strokeDasharray="5 5" dot={{ fill: '#0D9488', r: 4 }} name="Forecast" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Forecast Drivers */}
      <div className="card p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Forecast Drivers &amp; Operating Assumptions
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">
              Key operational parameters utilized by the forecasting model.
            </p>
          </div>
          <Settings2 size={16} className="text-slate-400" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {drivers.map((d) => (
            <div key={d.name} className="rounded bg-slate-50 border border-border-subtle p-2.5 text-center">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                {d.name}
              </p>
              <p
                className={`text-base font-bold mt-1 ${
                  d.type === 'positive'
                    ? 'text-status-success'
                    : d.type === 'negative'
                    ? 'text-status-warning'
                    : 'text-slate-700'
                }`}
              >
                {d.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="card p-4.5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Scenario Analysis
          </h3>
          <p className="text-2xs text-slate-400 mt-0.5">
            Model projected outcomes across base, optimistic, and conservative cases.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="inline-flex p-1 rounded-md bg-slate-100 border border-border-subtle">
          {scenarioTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setScenario(tab.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                scenario === tab.key
                  ? 'bg-white text-slate-900 font-semibold shadow-subtle'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scenario KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in" key={scenario}>
          <KpiCard label="Projected Revenue" value={current.revenue} emptyText="No data" />
          <KpiCard label="Projected EBITDA" value={current.ebitda} emptyText="No data" />
          <KpiCard label="Projected Net Income" value={current.netIncome} emptyText="No data" />
          <KpiCard label="Projected Cash" value={current.cash} emptyText="No data" />
          <KpiCard label="Projected Runway" value={current.runway} emptyText="No data" />
        </div>

        {/* Scenario Description */}
        <div className="p-3 rounded bg-slate-50 border border-border-subtle">
          <p className="text-xs text-slate-600 leading-relaxed">{current.description}</p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => onNavigate('insights')}>
          <span>Continue to Insights</span> <ArrowRight size={13} />
        </button>
      </div>

      {/* Adjust Drivers Modal */}
      <Modal
        open={driversOpen}
        onClose={() => setDriversOpen(false)}
        title="Adjust Forecast Drivers"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDriversOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => setDriversOpen(false)}>
              Apply Changes
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-2xs text-slate-500">
            Define operating assumptions to feed into the backend forecasting engine.
          </p>
          {drivers.map((d) => (
            <div key={d.name} className="p-2.5 rounded bg-slate-50 border border-border-subtle space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">{d.name}</label>
                <span className="font-mono text-2xs text-slate-500 font-semibold">{d.value}</span>
              </div>
              {d.description && <p className="text-[10px] text-slate-400">{d.description}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
