import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { ArrowRight, BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { WorkflowIndicator } from '@/components/ui/WorkflowIndicator';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import {
  BudgetVsActualPoint,
  CashFlowPoint,
  EbitdaTrendPoint,
  ExpenseBreakdownPoint,
  FinancialSummary,
  RevenueTrendPoint,
  StatementGroup,
} from '@/types/financial';

interface FinancialAnalyticsProps {
  onNavigate: (page: string) => void;
  companyName?: string | null;
  period?: string | null;
  currency?: string | null;
  summary?: FinancialSummary | null;
  revenueTrend?: RevenueTrendPoint[];
  ebitdaTrend?: EbitdaTrendPoint[];
  budgetVsActual?: BudgetVsActualPoint[];
  expenseBreakdown?: ExpenseBreakdownPoint[];
  cashFlow?: CashFlowPoint[];
  statementOverview?: StatementGroup[];
}

const defaultStatementOverview: StatementGroup[] = [
  {
    name: 'Income Statement',
    rows: [
      { label: 'Revenue', value: '—' },
      { label: 'Cost of Goods Sold', value: '—' },
      { label: 'Gross Profit', value: '—' },
      { label: 'Operating Expenses', value: '—' },
      { label: 'EBITDA', value: '—' },
      { label: 'Net Income', value: '—' },
    ],
  },
  {
    name: 'Balance Sheet',
    rows: [
      { label: 'Total Assets', value: '—' },
      { label: 'Total Liabilities', value: '—' },
      { label: "Shareholders' Equity", value: '—' },
      { label: 'Current Assets', value: '—' },
      { label: 'Current Liabilities', value: '—' },
    ],
  },
  {
    name: 'Cash Flow Statement',
    rows: [
      { label: 'Operating Cash Flow', value: '—' },
      { label: 'Investing Cash Flow', value: '—' },
      { label: 'Financing Cash Flow', value: '—' },
      { label: 'Net Change in Cash', value: '—' },
      { label: 'Ending Cash Balance', value: '—' },
    ],
  },
];

export function FinancialAnalytics({
  onNavigate,
  companyName = '—',
  period = '—',
  currency = 'USD',
  summary,
  revenueTrend = [],
  ebitdaTrend = [],
  budgetVsActual = [],
  expenseBreakdown = [],
  cashFlow = [],
  statementOverview = defaultStatementOverview,
}: FinancialAnalyticsProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <WorkflowIndicator current="analytics" onNavigate={onNavigate} />

      {/* Filter bar */}
      <FilterBar>
        <FilterSelect label="Company" value={companyName || '—'} options={[companyName || '—']} />
        <FilterSelect label="Period" value={period || '—'} options={[period || '—']} />
        <FilterSelect label="Currency" value={currency || 'USD'} options={['USD', 'EUR', 'GBP']} />
      </FilterBar>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
          label="Current Ratio"
          value={summary?.currentRatio?.value}
          emptyText="No data"
        />
        <KpiCard
          label="Quick Ratio"
          value={summary?.quickRatio?.value}
          emptyText="No data"
        />
        <KpiCard
          label="Cash Runway"
          value={summary?.cashRunway?.value}
          emptyText="No data"
        />
      </div>

      {/* Charts row 1: Revenue Trend & EBITDA Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Revenue Trend"
          subtitle="Quarterly revenue progression"
          isEmpty={revenueTrend.length === 0}
          emptyTitle="No financial data available"
          emptyDescription="Upload financial statements to generate revenue trend analysis."
          emptyIcon={BarChart3}
        >
          {revenueTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="#DBEAFE" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="EBITDA Trend"
          subtitle="Quarterly operating profitability"
          isEmpty={ebitdaTrend.length === 0}
          emptyTitle="No EBITDA data available"
          emptyDescription="Upload income statements to visualize EBITDA progression."
          emptyIcon={TrendingUp}
        >
          {ebitdaTrend.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ebitdaTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Line type="monotone" dataKey="ebitda" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2: Budget vs Actual & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Budget vs Actual"
          subtitle="Variance comparison across planning periods"
          isEmpty={budgetVsActual.length === 0}
          emptyTitle="No budget or actual data available"
          emptyDescription="Upload budget and actual statements to generate variance comparisons."
          emptyIcon={BarChart3}
        >
          {budgetVsActual.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetVsActual} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v: any) => `$${v}M`} />
                <Legend />
                <Bar dataKey="revenue" fill="#94A3B8" name="Budget Rev" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" fill="#2563EB" name="Actual Rev" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" fill="#CBD5E1" name="Budget Exp" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actualExpenses" fill="#D97706" name="Actual Exp" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Expense Breakdown"
          subtitle="Operating cost category distribution"
          isEmpty={expenseBreakdown.length === 0}
          emptyTitle="No expense data available"
          emptyDescription="Upload general ledger or expense details to visualize cost distribution."
          emptyIcon={PieIcon}
        >
          {expenseBreakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {expenseBreakdown.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 3: Cash Flow & Financial Statement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Cash Flow"
          subtitle="Operating, Investing, Financing cash flows"
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

        {/* Financial Statement Overview */}
        <div className="card p-4.5">
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Financial Statement Overview
            </h3>
            <p className="text-2xs text-slate-400 mt-0.5">High-level statement lines from normalized accounts.</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {statementOverview.map((stmt) => (
              <div key={stmt.name} className="rounded bg-slate-50 border border-border-subtle p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2 pb-1 border-b border-slate-200">
                  {stmt.name}
                </p>
                <div className="space-y-1.5">
                  {stmt.rows.map((row) => (
                    <div key={row.label} className="flex flex-col">
                      <span className="text-[10px] text-slate-400 leading-tight truncate">{row.label}</span>
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Trend Summary */}
      <div className="card p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="kpi-label">Revenue Growth</p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {summary?.revenueGrowth || '—'}
            </p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="kpi-label">Net Income Growth</p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {summary?.netIncomeGrowth || '—'}
            </p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="kpi-label">EBITDA Margin</p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {summary?.ebitdaMargin || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <button className="btn-primary" onClick={() => onNavigate('forecast')}>
          <span>Continue to Forecast</span> <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
