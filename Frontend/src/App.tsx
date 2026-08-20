import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Dashboard } from '@/pages/Dashboard';
import { UploadData } from '@/pages/UploadData';
import { Ingestion } from '@/pages/Ingestion';
import { DataReview } from '@/pages/DataReview';
import { FinancialAnalytics } from '@/pages/FinancialAnalytics';
import { Forecast } from '@/pages/Forecast';
import { Insights } from '@/pages/Insights';
import { AIReview } from '@/pages/AIReview';
import { WP514 } from '@/pages/WP514';
import { Reports } from '@/pages/Reports';
import { CompanyProfile, UploadedFile } from '@/types/financial';
import { User, Shield, Key } from 'lucide-react';

type PageId =
  | 'dashboard'
  | 'upload'
  | 'ingestion'
  | 'data-review'
  | 'analytics'
  | 'forecast'
  | 'insights'
  | 'ai-review'
  | 'wp514'
  | 'reports'
  | 'settings'
  | 'profile';

const pageMeta: Record<PageId, { title: string; description: string }> = {
  dashboard: {
    title: 'Financial Dashboard',
    description: 'Executive overview of financial performance, validation exceptions, and deliverables.',
  },
  upload: {
    title: 'Upload Financial Data',
    description: 'Upload financial statements, planning models, and commentary to begin analysis.',
  },
  ingestion: {
    title: 'Data Ingestion Pipeline',
    description: 'Data extraction, schema normalization, and validation processing stages.',
  },
  'data-review': {
    title: 'Data Review & Exceptions',
    description: 'Review and resolve validation exceptions and tie-out discrepancies.',
  },
  analytics: {
    title: 'Financial Analytics',
    description: 'Detailed analysis of core financial statements, ratios, and operating trends.',
  },
  forecast: {
    title: 'FP&A Forecast & Scenarios',
    description: 'Forward-looking financial projections and driver-based scenario analysis.',
  },
  insights: {
    title: 'Insights & Recommendations',
    description: 'Automated identification of operational risks, opportunities, and strategic actions.',
  },
  'ai-review': {
    title: 'AI Financial Review',
    description: 'Report-level executive summary of financial performance and audit findings.',
  },
  wp514: {
    title: 'WP-514 Working Paper',
    description: 'Standard working paper with procedure checklists, findings, and sign-offs.',
  },
  reports: {
    title: 'Reports & Exports',
    description: 'Generate and export financial analysis deliverables and working papers.',
  },
  settings: {
    title: 'Application Settings',
    description: 'Configure reporting defaults, currency settings, and system parameters.',
  },
  profile: {
    title: 'User Profile',
    description: 'Manage analyst profile, credentials, and organizational assignments.',
  },
};

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedDataset, setSelectedDataset] = useState<string>('error_data');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: 'Enterprise Operating Entity',
    period: 'FY2025/2026',
    currency: 'USD',
  });

  const navigate = (p: string) => setPage(p as PageId);
  const meta = pageMeta[page] || pageMeta.dashboard;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigate}
            selectedDataset={selectedDataset}
            onDatasetChange={setSelectedDataset}
          />
        );
      case 'upload':
        return (
          <UploadData
            onNavigate={navigate}
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
          />
        );
      case 'ingestion':
        return <Ingestion onNavigate={navigate} files={uploadedFiles} />;
      case 'data-review':
        return <DataReview onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'analytics':
        return <FinancialAnalytics onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'forecast':
        return <Forecast onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'insights':
        return <Insights onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'ai-review':
        return <AIReview onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'wp514':
        return <WP514 onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'reports':
        return <Reports onNavigate={navigate} selectedDataset={selectedDataset} />;
      case 'settings':
        return (
          <SettingsPage
            companyProfile={companyProfile}
            onUpdateProfile={setCompanyProfile}
          />
        );
      case 'profile':
        return <ProfilePage />;
      default:
        return (
          <Dashboard
            onNavigate={navigate}
            selectedDataset={selectedDataset}
            onDatasetChange={setSelectedDataset}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar active={page} onNavigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-x-hidden">
          <div className="max-w-[1320px] mx-auto">
            <PageHeader
              title={meta.title}
              description={meta.description}
              company={selectedDataset.toUpperCase()}
              period={companyProfile.period || 'FY2025/2026'}
              currency={companyProfile.currency || 'USD'}
              notifications={0}
              userName="FP&A Team"
              userRole="Finance Reviewer"
            />
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

interface SettingsPageProps {
  companyProfile: CompanyProfile;
  onUpdateProfile: (profile: CompanyProfile) => void;
}

function SettingsPage({ companyProfile, onUpdateProfile }: SettingsPageProps) {
  return (
    <div className="card p-6 max-w-2xl animate-fade-in space-y-4">
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Financial Modeling Preferences
        </h3>
        <p className="text-2xs text-slate-400 mt-0.5">
          Configure default reporting entities, currency display, and validation strictness.
        </p>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="kpi-label mb-1 block">Default Reporting Entity</label>
          <input
            type="text"
            value={companyProfile.name}
            onChange={(e) =>
              onUpdateProfile({ ...companyProfile, name: e.target.value })
            }
            placeholder="e.g., Enterprise Operating Entity"
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kpi-label mb-1 block">Default Currency</label>
            <select
              className="input"
              value={companyProfile.currency}
              onChange={(e) =>
                onUpdateProfile({ ...companyProfile, currency: e.target.value })
              }
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="kpi-label mb-1 block">Default Reporting Period</label>
            <input
              type="text"
              value={companyProfile.period}
              onChange={(e) =>
                onUpdateProfile({ ...companyProfile, period: e.target.value })
              }
              placeholder="e.g., FY2026"
              className="input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="card p-6 max-w-2xl animate-fade-in space-y-5">
      <div className="flex items-center gap-3.5 pb-4 border-b border-border-subtle">
        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
          <User size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Finance Reviewer</h3>
          <p className="text-xs text-slate-500">Corporate FP&amp;A &amp; Financial Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 text-xs">
        <div>
          <p className="kpi-label">Role</p>
          <p className="font-semibold text-slate-800 mt-0.5">Senior Financial Analyst</p>
        </div>
        <div>
          <p className="kpi-label">Access Level</p>
          <div className="flex items-center gap-1 mt-0.5 text-slate-700 font-medium">
            <Shield size={13} className="text-accent" />
            <span>Full Analyst Access</span>
          </div>
        </div>
        <div>
          <p className="kpi-label">Department</p>
          <p className="font-semibold text-slate-800 mt-0.5">Corporate FP&amp;A / Treasury</p>
        </div>
        <div>
          <p className="kpi-label">Authentication</p>
          <div className="flex items-center gap-1 mt-0.5 text-slate-700 font-medium">
            <Key size={13} className="text-emerald-600" />
            <span>SSO Enterprise Authenticated</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
