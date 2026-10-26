import React, { useState } from 'react';
import {
  Bell,
  Terminal,
  RefreshCw,
  ChevronDown,
  Layers,
  Sparkles,
  User
} from 'lucide-react';

interface NavbarProps {
  systemReady: boolean | null;
  activeAlertsCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSelectPage: (page: string) => void;
  onOpenDeployModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemReady,
  activeAlertsCount,
  onRefresh,
  isRefreshing,
  onSelectPage,
  onOpenDeployModal
}) => {
  const [currentWorkspace, setCurrentWorkspace] = useState('Production Cluster (US-East)');
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const workspaces = [
    'Production Cluster (US-East)',
    'Staging Environment (EU-Central)',
    'Local Inference Engine'
  ];

  return (
    <header className="h-16 border-b border-[#303030] bg-[#060606]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand mark & Workspace Selector */}
      <div className="flex items-center gap-6">
        {/* Brand Mark */}
        <div 
          onClick={() => onSelectPage('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#303030] flex items-center justify-center text-[#C6915A] group-hover:border-[#C6915A] transition duration-200">
            {/* Geometric minimal logo icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wider text-[#F1D7AE]">LUMEN AI</span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-[#A5A19C] ml-2 font-mono">
              OBSERVABILITY
            </span>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] hover:bg-[#171717] border border-[#303030] rounded-lg text-xs text-[#F1D7AE] font-mono transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#C6915A]" />
            <span className="truncate max-w-[170px]">{currentWorkspace}</span>
            <ChevronDown className="w-3 h-3 text-[#A5A19C]" />
          </button>

          {workspaceOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-[#171717] border border-[#303030] rounded-lg shadow-lumen py-1 z-50 text-xs font-mono">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#A5A19C] border-b border-[#262626]">
                Select Cluster
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setWorkspaceOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#222222] transition ${
                    currentWorkspace === ws ? 'text-[#C6915A] font-semibold bg-[#1a1510]' : 'text-[#F1D7AE]'
                  }`}
                >
                  {ws}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center/Right: System status, Actions & Controls */}
      <div className="flex items-center gap-4">
        {/* Restrained live system status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#2b2b2b] text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${
            systemReady === true ? 'bg-[#78c291] shadow-[0_0_8px_#78c291]' :
            systemReady === false ? 'bg-[#e07d7d]' : 'bg-[#C6915A] animate-pulse'
          }`} />
          <span className="text-[#A5A19C]">
            {systemReady === true ? 'System Optimal' : systemReady === false ? 'Service Unavailable' : 'Probing Runtime...'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#171717] border border-[#303030] rounded-lg transition disabled:opacity-50"
          title="Refresh telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6915A]' : ''}`} />
        </button>

        {/* Notifications / Alerts icon */}
        <button
          onClick={() => onSelectPage('alerts')}
          className="relative p-2 text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#171717] border border-[#303030] rounded-lg transition"
          title="Operational Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#C6915A] text-[9px] font-bold text-[#060606] rounded-full">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Prominent Deploy Model / Playground actions */}
        <button
          onClick={() => onSelectPage('playground')}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-[#F1D7AE] bg-[#171717] hover:bg-[#202020] border border-[#303030] hover:border-[#C6915A] rounded-lg transition"
        >
          <Terminal className="w-3.5 h-3.5 text-[#C6915A]" />
          <span>Playground</span>
        </button>

        <button
          onClick={onOpenDeployModal}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-[#060606] bg-[#C6915A] hover:bg-[#B4804B] rounded-lg transition shadow-lumen-glow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deploy Model</span>
        </button>

        {/* Profile Avatar Minimal */}
        <div className="w-8 h-8 rounded-full bg-[#171717] border border-[#303030] flex items-center justify-center text-[#A5A19C]">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
};
