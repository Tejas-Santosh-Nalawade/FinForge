import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Sparkles,
  FileText,
  Download,
  Settings,
  User,
  Building2,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { navGroups } from '@/config/navigation';

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  upload: Upload,
  'clipboard-check': ClipboardCheck,
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  'file-text': FileText,
  download: Download,
  settings: Settings,
  user: User,
};

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0B1528] border-r border-[#152542] flex flex-col select-none z-20">
      {/* App Branding */}
      <div className="px-4 py-4 border-b border-[#152542]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-white shadow-subtle">
            <Building2 size={15} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wider">FINFORGE</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise FP&amp;A</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`nav-item w-full text-left ${
                      isActive ? 'nav-item-active' : 'nav-item-inactive'
                    }`}
                  >
                    {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="px-2.5 py-3 border-t border-[#152542] space-y-0.5">
        <button
          onClick={() => onNavigate('settings')}
          className={`nav-item w-full text-left ${
            active === 'settings' ? 'nav-item-active' : 'nav-item-inactive'
          }`}
        >
          <Settings size={14} className={active === 'settings' ? 'text-white' : 'text-slate-400'} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className={`nav-item w-full text-left ${
            active === 'profile' ? 'nav-item-active' : 'nav-item-inactive'
          }`}
        >
          <User size={14} className={active === 'profile' ? 'text-white' : 'text-slate-400'} />
          <span>User Profile</span>
        </button>
      </div>
    </aside>
  );
}
