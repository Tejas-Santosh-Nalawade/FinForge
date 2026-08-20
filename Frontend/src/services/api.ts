/**
 * FinForge API Service
 * Centralized API client for fetching deterministic engine audit, analytics, forecast, and WP-514 data.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

export interface EngineAuditProcedure {
  reference: string;
  procedure?: string;
  name?: string;
  description?: string;
  category?: string;
  status: 'PASS' | 'FAIL' | string;
  calculated_value?: number | string;
  reported_value?: number | string;
  variance?: number;
  issue?: string | null;
  resolution?: string | null;
  details?: string;
  note?: string;
}

export interface EngineAuditReport {
  engagement?: {
    company_name?: string;
    period?: string;
    currency?: string;
    auditor?: string;
    audit_date?: string;
  };
  procedures: EngineAuditProcedure[];
  findings: Array<{
    finding_id?: string;
    category?: string;
    description?: string;
    severity?: string;
    impact_amount?: number;
  }>;
  conclusion: {
    overall_status: 'CLEARED' | 'FAIL' | 'FLAGGED' | string;
    total_procedures_run: number;
    procedures_passed: number;
    text: string;
  };
}

export interface EngineAnalyticsReport {
  engagement?: any;
  analytics?: {
    income_statement?: Array<{
      line_item: string;
      prior_period: number;
      current_period: number;
      variance: number;
      variance_pct: number;
      threshold_status: string;
    }>;
    balance_sheet?: Array<{
      line_item: string;
      prior_period: number;
      current_period: number;
      variance: number;
      variance_pct: number;
      threshold_status: string;
    }>;
    ratios?: Array<{
      category: string;
      name: string;
      formula: string;
      prior_period: number;
      current_period: number;
      benchmark: string;
      status: string;
      assessment: string;
    }>;
    relationship_disconnects?: any[];
    bva_attainment?: any;
    cash_runway_velocity?: any;
    historical_baseline_analytics?: any;
  };
  findings?: any[];
  conclusion?: any;
}

export interface EngineForecastReport {
  dataset_id?: string;
  strategic_recommendations: {
    executive_summary?: any;
    capital_allocation_policy?: any[];
    risk_mitigation_matrix?: any[];
    recommendations?: Array<{
      category: string;
      title: string;
      action: string;
      expected_impact: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
  };
  projections?: any;
}

export interface WP514Data {
  dataset_id: string;
  wp_reference: string;
  title: string;
  period: string;
  overall_status: string;
  total_procedures: number;
  passed_procedures: number;
  failed_procedures: number;
  schedules: Array<{
    wp_ref: string;
    procedure_name: string;
    category: string;
    status: string;
    calculated_value: any;
    reported_value: any;
    variance: number;
    tick_mark: string;
    notes: string;
  }>;
  findings: any[];
  conclusion: any;
}

export async function fetchDatasets(): Promise<DatasetItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/engine/datasets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.datasets || [];
  } catch (err) {
    console.warn('API Error fetching datasets, returning fallback:', err);
    return [
      { id: 'error_data', name: 'Error Data (Flawed / Exceptions)', description: 'Financial dataset with intentional errors.', is_default: true },
      { id: 'true_data', name: 'True Data (Clean / Reconciled)', description: 'Financial dataset with clean tie-outs.', is_default: false },
    ];
  }
}

export async function runEngine(datasetId: string, remediated: boolean = false): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, remediated }),
  });
  if (!res.ok) throw new Error(`Engine execution failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchAuditReport(datasetId: string): Promise<EngineAuditReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/audit-report/${datasetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchAnalyticsReport(datasetId: string): Promise<EngineAnalyticsReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/analytics/${datasetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchForecastReport(datasetId: string): Promise<EngineForecastReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/forecast/${datasetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export interface EngineAISummary {
  dataset_id: string;
  ai_engine: string;
  overall_status: string;
  confidence_score: number;
  summary: {
    executive_summary: string;
    key_findings: string[];
    key_risks: string[];
    recommended_actions: string[];
    report_commentary?: string;
  };
}

export async function fetchWP514Data(datasetId: string): Promise<WP514Data> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/wp514/${datasetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchAISummary(datasetId: string): Promise<EngineAISummary> {
  const res = await fetch(`${API_BASE_URL}/api/v1/engine/ai-summary/${datasetId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function getDownloadUrl(datasetId: string, fileType: string): string {
  return `${API_BASE_URL}/api/v1/engine/download/${datasetId}/${fileType}`;
}

export function getChartUrl(datasetId: string, chartName: string): string {
  return `${API_BASE_URL}/api/v1/engine/chart/${datasetId}/${chartName}`;
}

