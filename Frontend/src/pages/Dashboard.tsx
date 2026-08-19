import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Database,
  AlertTriangle,
  TrendingUp,
  FileText,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ChartCard } from '@/components/ui/ChartCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { defaultReports } from '@/config/navigation';
import {
  BudgetVsActualPoint,
  CashFlowPoint,
  ExpenseBreakdownPoint,
  FinancialSummary,
  ForecastPoint,
  InsightItem,
  RevenueTrendPoint,
  StatusCardItem,
  ValidationException,
} from '@/types/financial';

interface DashboardProps {
  onNavigate: (page: string) => void;
  summary?: FinancialSummary | null;
  revenueTrend?: RevenueTrendPoint[];
  budgetVsActual?: BudgetVsActualPoint[];
  cashFlow?: CashFlowPoint[];
  expenseBreakdown?: ExpenseBreakdownPoint[];
  forecastSnapshot?: ForecastPoint[];
  criticalIssues?: ValidationException[];
  recommendations?: InsightItem[];
}

const defaultStatusCards: StatusCardItem[] = [
  { label: 'Data Status', value: 'No data', status: 'faint', icon: 'database' },
  { label: 'Validation', value: '0 issues', status: 'faint', icon: 'alert' },
  { label: 'Forecast', value: 'Not generated', status: 'faint', icon: 'trending' },
  { label: 'WP-514', value: 'Not started', status: 'faint', icon: 'file' },
];

export function Dashboard({
  onNavigate,
  summary,
  revenueTrend = [],
  budgetVsActual = [],
  cashFlow = [],
  expenseBreakdown = [],
  forecastSnapshot = [],
  criticalIssues = [],
  recommendations = [],
}: DashboardProps) {
  const hasData =
    Boolean(summary?.revenue?.value) ||
    revenueTrend.length > 0 ||
    budgetVsActual.length > 0 ||
    cashFlow.length > 0;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Empty State Action Banner when no data */}
      {!hasData && (
        <div className="card p-4.5 bg-blue-50/50 border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">No financial data available</h2>
              <p className="text-2xs text-slate-500 mt-0.5">
                Upload financial statements or planning data to begin analysis and generate reports.
              </p>
            </div>
          </div>
          <button className="btn-primary shrink-0 self-start sm:self-auto" onClick={() => onNavigate('upload')}>
            <UploadCloud size={13} />
            <span>Upload Data</span>
          </button>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {defaultStatusCards.map((card) => {
          const Icon =
            card.icon === 'database'
              ? Database
              : card.icon === 'alert'
              ? AlertTriangle
              : card.icon === 'trending'
              ? TrendingUp
              : FileText;

          return (
            <div key={card.label} className="card p-3.5 card-hover">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Revenue"
          value={summary?.revenue?.value}
          change={summary?.revenue?.change}
          direction={summary?.revenue?.direction}
          emptyText="No data"
        />
        <KpiCard
          label="EBITDA"
          value={summary?.ebitda?.value}
          change={summary?.ebitda?.change}
          direction={summary?.ebitda?.direction}
          emptyText="No data"
        />
        <KpiCard
          label="Net Income"
          value={summary?.netIncome?.value}
          change={summary?.netIncome?.change}
          direction={summary?.netIncome?.direction}
          emptyText="No data"
        />
        <KpiCard
          label="Cash"
          value={summary?.cash?.value}
          change={summary?.cash?.change}
          direction={summary?.cash?.direction}
          emptyText="No data"
        />
        <KpiCard
          label="Cash Runway"
          value={summary?.cashRunway?.value}
          suffix="Months of operations"
          emptyText="No data"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Revenue Trend"
          subtitle="Quarterly revenue progression"
          isEmpty={revenueTrend.length === 0}
          emptyTitle="No data available"
          emptyDescription="Upload financial statements to generate revenue trend analysis."
          emptyIcon={BarChart3}
        >
          {revenueTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => [`$${v}M`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="#DBEAFE" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Budget vs Actual"
          subtitle="Quarterly performance against plan"
          isEmpty={budgetVsActual.length === 0}
          emptyTitle="No planning data available"
          emptyDescription="Upload budget and actual statements to generate variance comparisons."
          emptyIcon={FileSpreadsheet}
        >
          {budgetVsActual.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetVsActual} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Legend />
                <Bar dataKey="revenue" fill="#94A3B8" name="Budget Rev" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" fill="#2563EB" name="Actual Rev" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Cash Flow"
          subtitle="Operating, investing, and financing activities"
          isEmpty={cashFlow.length === 0}
          emptyTitle="No cash flow data available"
          emptyDescription="Upload cash flow statements to generate cash flow analysis."
          emptyIcon={TrendingUp}
        >
          {cashFlow.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Legend />
                <Bar dataKey="operating" fill="#16A34A" name="Operating" radius={[2, 2, 0, 0]} />
                <Bar dataKey="investing" fill="#D97706" name="Investing" radius={[2, 2, 0, 0]} />
                <Bar dataKey="financing" fill="#2563EB" name="Financing" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Expense Breakdown"
          subtitle="Operating expense distribution"
          isEmpty={expenseBreakdown.length === 0}
          emptyTitle="No expense data available"
          emptyDescription="Upload general ledger or expense details to visualize cost distribution."
          emptyIcon={PieIcon}
        >
          {expenseBreakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Bottom row: Critical Issues + Latest Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Validation Issues */}
        <div className="card p-4.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-900">Critical Validation Issues</h3>
            <button
              onClick={() => onNavigate('data-review')}
              className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
            >
              View Data Review <ArrowRight size={11} />
            </button>
          </div>
          {criticalIssues.length === 0 ? (
            <EmptyState
              compact
              icon={AlertTriangle}
              title="No validation issues recorded"
              description="Upload and process financial data to run automated tie-out and validation checks."
            />
          ) : (
            <div className="space-y-2">
              {criticalIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-3 p-2.5 rounded bg-slate-50 border border-border-subtle"
                >
                  <AlertTriangle size={15} className="text-status-critical shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{issue.issue}</p>
                    <p className="text-2xs text-slate-400">{issue.area}</p>
                  </div>
                  <StatusBadge status="critical">{issue.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Recommendations */}
        <div className="card p-4.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-900">Key Recommendations</h3>
            <button
              onClick={() => onNavigate('insights')}
              className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
            >
              View Insights <ArrowRight size={11} />
            </button>
          </div>
          {recommendations.length === 0 ? (
            <EmptyState
              compact
              icon={TrendingUp}
              title="No recommendations available"
              description="Insights and strategic actions will appear once financial statements are analyzed."
            />
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-2.5 rounded bg-slate-50 border border-border-subtle"
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-2xs font-bold ${
                      rec.priority === 'High'
                        ? 'bg-red-50 text-status-critical border border-red-200'
                        : 'bg-amber-50 text-status-warning border border-amber-200'
                    }`}
                  >
                    {rec.priority === 'High' ? 'H' : 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{rec.title}</p>
                    <p className="text-2xs text-slate-400">{rec.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forecast Snapshot & Deliverables Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Forecast Snapshot */}
        <div className="card p-4.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-900">Forecast Snapshot</h3>
            <button
              onClick={() => onNavigate('forecast')}
              className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
            >
              Open Forecast <ArrowRight size={11} />
            </button>
          </div>
          {forecastSnapshot.length === 0 ? (
            <EmptyState
              compact
              icon={TrendingUp}
              title="No forecast data available"
              description="Generate a forecast using historical statements and operating driver assumptions."
            />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={forecastSnapshot}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Area type="monotone" dataKey="forecast" stroke="#0D9488" strokeWidth={2} fill="#CCFBF1" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Deliverables Status */}
        <div className="card p-4.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-900">Deliverables Status</h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-2xs font-semibold text-accent hover:text-accent-deep flex items-center gap-1"
            >
              Manage Reports <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {defaultReports.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-2 rounded bg-slate-50 border border-border-subtle"
              >
                <Info size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">{r.name}</span>
                <StatusBadge status="faint">Not generated</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
