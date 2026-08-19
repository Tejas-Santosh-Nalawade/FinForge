import {
  NavGroup,
  ReportDefinition,
  WorkflowStepItem,
  WP514Procedure,
} from '@/types/financial';

export const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' }],
  },
  {
    label: 'DATA',
    items: [
      { id: 'upload', label: 'Upload Data', icon: 'upload' },
      { id: 'data-review', label: 'Data Review', icon: 'clipboard-check' },
    ],
  },
  {
    label: 'ANALYSIS',
    items: [
      { id: 'analytics', label: 'Financial Analytics', icon: 'bar-chart-3' },
      { id: 'forecast', label: 'Forecast', icon: 'trending-up' },
      { id: 'insights', label: 'Insights & Recommendations', icon: 'lightbulb' },
    ],
  },
  {
    label: 'AI',
    items: [{ id: 'ai-review', label: 'AI Financial Review', icon: 'sparkles' }],
  },
  {
    label: 'REPORTING',
    items: [
      { id: 'wp514', label: 'WP-514', icon: 'file-text' },
      { id: 'reports', label: 'Reports & Exports', icon: 'download' },
    ],
  },
];

export const workflowSteps: WorkflowStepItem[] = [
  { id: 'upload', label: 'Upload', page: 'upload' },
  { id: 'review', label: 'Review', page: 'data-review' },
  { id: 'analytics', label: 'Analytics', page: 'analytics' },
  { id: 'forecast', label: 'Forecast', page: 'forecast' },
  { id: 'insights', label: 'Insights', page: 'insights' },
  { id: 'ai', label: 'AI Review', page: 'ai-review' },
  { id: 'wp514', label: 'WP-514', page: 'wp514' },
  { id: 'reports', label: 'Reports', page: 'reports' },
];

export const supportedDataTypes = [
  { name: 'Financial Statements', icon: 'file-text', format: 'Income Statement, Balance Sheet, Cash Flow' },
  { name: 'General Ledger', icon: 'layers', format: 'Journal Entries & Chart of Accounts' },
  { name: 'Trial Balance', icon: 'scale', format: 'Period-End Trial Balances' },
  { name: 'Annual Operating Budget', icon: 'calculator', format: 'Budget & Target Models' },
  { name: 'Rolling Forecast', icon: 'trending-up', format: 'Monthly / Quarterly Rolling Assumptions' },
  { name: 'Operational Drivers', icon: 'activity', format: 'Volume, Headcount, Pricing Metrics' },
  { name: 'MD&A / Commentary', icon: 'message-square', format: 'Management Notes & Variance Analysis' },
];

export const standardAuditProcedures: WP514Procedure[] = [
  { label: 'Mathematical Accuracy & Tie-outs', done: false },
  { label: 'Prior Year Comparative Consistency', done: false },
  { label: 'Balance Sheet Equation Reconciliation', done: false },
  { label: 'Cash Flow Direct/Indirect Tie-out', done: false },
  { label: 'Operating Margin & Ratio Analysis', done: false },
  { label: 'Forecast Driver Variance Review', done: false },
];

export const defaultReports: ReportDefinition[] = [
  {
    id: 'wp514',
    name: 'WP-514 Working Paper',
    description: 'Comprehensive working paper detailing validation checks, findings, procedures, and reviewer sign-off.',
    formats: ['PDF', 'Excel'],
    generated: false,
  },
  {
    id: 'analysis',
    name: 'Financial Analysis Report',
    description: 'Detailed financial performance overview covering core statements, key metrics, and historical variances.',
    formats: ['PDF', 'Excel'],
    generated: false,
  },
  {
    id: 'forecast',
    name: 'Forecast & Scenario Model',
    description: 'Forward-looking projections across base, optimistic, and conservative cases with driver sensitivity.',
    formats: ['PDF', 'Excel'],
    generated: false,
  },
  {
    id: 'exec',
    name: 'Executive Summary',
    description: 'High-level synthesis of financial condition, key findings, strategic risks, and recommended actions.',
    formats: ['PDF'],
    generated: false,
  },
];

export const defaultIngestionPipeline = [
  { id: 1, label: 'File uploaded', status: 'pending' as const },
  { id: 2, label: 'File extracted', status: 'pending' as const },
  { id: 3, label: 'Data normalized', status: 'pending' as const },
  { id: 4, label: 'Validation executed', status: 'pending' as const },
  { id: 5, label: 'Analytics prepared', status: 'pending' as const },
  { id: 6, label: 'Forecast prepared', status: 'pending' as const },
];
