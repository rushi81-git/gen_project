import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Terminal,
  FileText,
  AlertTriangle,
  Award,
  Settings,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  activeAlertsCount
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'models', label: 'Model Gallery', icon: Cpu },
    { id: 'playground', label: 'Playground', icon: Terminal },
    { id: 'logs', label: 'Inference Logs', icon: FileText },
    { id: 'alerts', label: 'Operational Alerts', icon: AlertTriangle, badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { id: 'evaluation', label: 'Benchmark Quality', icon: Award },
    { id: 'settings', label: 'System & Security', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-[#303030] bg-[#0c0c0c] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-[#A5A19C] uppercase font-mono">
            Navigation Rail
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-[#1e1711] text-[#F1D7AE] border border-[#C6915A]/40 shadow-sm'
                      : 'text-[#A5A19C] hover:text-[#F1D7AE] hover:bg-[#151515] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6915A]' : 'text-[#6b6762]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#C6915A] text-[#060606] rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Architectural Spec Card */}
      <div className="p-3.5 bg-[#121212] border border-[#262626] rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest text-[#A5A19C] uppercase font-mono">
            Engine Spec
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#78c291]" />
        </div>
        <p className="text-[11px] text-[#A5A19C] leading-relaxed">
          Active Hugging Face router, local Transformers pipeline, and mock sandbox ready.
        </p>
      </div>
    </aside>
  );
};
