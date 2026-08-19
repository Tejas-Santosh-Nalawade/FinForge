/**
 * Enterprise Financial Data Models & Types
 * Data-agnostic definitions ready for backend integration
 */

export interface CompanyProfile {
  name: string;
  period: string;
  currency: string;
}

export interface KpiMetric {
  value: string | number | null;
  change?: number | null;
  direction?: 'up' | 'down';
  suffix?: string;
}

export interface FinancialSummary {
  revenue?: KpiMetric;
  ebitda?: KpiMetric;
  netIncome?: KpiMetric;
  cash?: KpiMetric;
  currentRatio?: KpiMetric;
  quickRatio?: KpiMetric;
  cashRunway?: KpiMetric;
  ebitdaMargin?: string;
  revenueGrowth?: string;
  netIncomeGrowth?: string;
}

export interface StatusCardItem {
  label: string;
  value: string;
  status: 'success' | 'warning' | 'critical' | 'info' | 'faint';
  icon: string;
}

export interface RevenueTrendPoint {
  quarter: string;
  revenue: number;
  actual?: number;
}

export interface BudgetVsActualPoint {
  quarter: string;
  revenue?: number;
  actual?: number;
  expenses?: number;
  actualExpenses?: number;
  ebitda?: number;
  actualEbitda?: number;
}

export interface CashFlowPoint {
  quarter: string;
  operating: number;
  investing: number;
  financing: number;
}

export interface ExpenseBreakdownPoint {
  name: string;
  value: number;
  color: string;
}

export interface EbitdaTrendPoint {
  quarter: string;
  ebitda: number;
}

export interface StatementRow {
  label: string;
  value: string;
}

export interface StatementGroup {
  name: string;
  rows: StatementRow[];
}

export interface ValidationException {
  id: string;
  area: string;
  field: string;
  issue: string;
  rule: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'Open' | 'Resolved' | 'Waived';
  expected?: string;
  calculated?: string;
  difference?: string;
  explanation?: string;
  source?: {
    file: string;
    sheet?: string;
    row?: string;
  };
}

export interface ForecastDriver {
  name: string;
  value: string;
  type: 'positive' | 'neutral' | 'negative';
  description?: string;
}

export interface ForecastPoint {
  quarter: string;
  actual?: number | null;
  forecast?: number | null;
  low?: number | null;
  high?: number | null;
}

export interface ScenarioMetricSet {
  revenue: string;
  ebitda: string;
  netIncome: string;
  cash: string;
  runway: string;
  description?: string;
}

export type ScenarioKey = 'base' | 'optimistic' | 'conservative';

export interface InsightMetric {
  label: string;
  value: string;
}

export interface InsightItem {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  section: 'key' | 'risk' | 'opportunity';
  metrics: InsightMetric[];
  recommendation: string;
  impact: string;
}

export interface AISummaryReport {
  outlook: 'MODERATE' | 'POSITIVE' | 'NEGATIVE';
  executiveSummary: string;
  keyFindings: string[];
  financialOutlook: string;
  keyRisks: string[];
  recommendedActions: string[];
  confidenceScore?: number;
}

export interface WP514Finding {
  id: string;
  area: string;
  issue: string;
  impact: string;
  status: 'Open' | 'Resolved' | 'Waived';
  actionComment?: string;
  reviewer?: string;
  date?: string;
}

export interface WP514Procedure {
  label: string;
  done: boolean;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  formats: ('PDF' | 'Excel')[];
  generated?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  fileObject?: File;
  uploadedAt?: Date;
}

export interface IngestionStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export interface WorkflowStepItem {
  id: string;
  label: string;
  page: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}
