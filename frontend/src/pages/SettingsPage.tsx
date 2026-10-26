import React, { useState, useEffect } from 'react';
import {
  Database,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { SystemReadyResponse } from '../types';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [readyInfo, setReadyInfo] = useState<SystemReadyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReady();
      setReadyInfo(data);
    } catch (err) {
      console.error('Failed to probe system readiness:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
            Infrastructure Governance
          </span>
          <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
            System & Security Configuration
          </h1>
          <p className="text-xs text-[#A5A19C] mt-1 font-mono">
            Relational persistence verification, local accelerator diagnostics, and confidential prompt privacy policies.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#1a1a1a] border border-[#303030] rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C6915A] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Probe Runtime</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Persistence */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-[#282828] pb-3">
            <Database className="w-4 h-4 text-[#C6915A]" />
            <h2 className="text-sm font-medium text-[#F1D7AE]">Relational Persistence</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <div>
                <span className="font-semibold text-[#F1D7AE] block font-sans">Database Connectivity</span>
                <span className="text-[#A5A19C] text-[11px]">SQLAlchemy Session Engine</span>
              </div>
              {readyInfo?.database_connected ? (
                <span className="inline-flex items-center gap-1.5 text-[#78c291] font-medium font-sans">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#e07d7d] font-medium font-sans">
                  <XCircle className="w-4 h-4" /> Disconnected
                </span>
              )}
            </div>

            <div className="p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg text-[#A5A19C] text-[11px] leading-relaxed font-sans">
              Active Driver: <strong className="text-[#F1D7AE] font-mono">SQLite (Local Dev) / PostgreSQL (Docker Compose)</strong>. Database versioning and incremental migrations managed via <strong className="text-[#F1D7AE] font-mono">Alembic</strong>.
            </div>
          </div>
        </div>

        {/* Compute Acceleration */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-[#282828] pb-3">
            <Cpu className="w-4 h-4 text-[#C6915A]" />
            <h2 className="text-sm font-medium text-[#F1D7AE]">Compute Device & ML Engine</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <div>
                <span className="font-semibold text-[#F1D7AE] block font-sans">Transformers / PyTorch</span>
                <span className="text-[#A5A19C] text-[11px]">Local inference engine libraries</span>
              </div>
              {readyInfo?.local_ml_dependencies ? (
                <span className="inline-flex items-center gap-1.5 text-[#78c291] font-sans">
                  <CheckCircle2 className="w-4 h-4" /> Installed
                </span>
              ) : (
                <span className="text-[11px] text-[#C6915A] font-sans">
                  Optional (Install via requirements-ml.txt)
                </span>
              )}
            </div>

            <div className="p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F1D7AE] block font-sans">Detected Hardware</span>
                <span className="text-[#A5A19C] text-[11px]">Selected inference compute target</span>
              </div>
              <span className="font-bold text-[#C6915A] px-2.5 py-0.5 bg-[#171717] rounded border border-[#303030] uppercase">
                {readyInfo?.compute_device || 'CPU'}
              </span>
            </div>
          </div>
        </div>

        {/* Hugging Face Secrets */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-[#282828] pb-3">
            <Key className="w-4 h-4 text-[#C6915A]" />
            <h2 className="text-sm font-medium text-[#F1D7AE]">Hugging Face Provider Token</h2>
          </div>

          <div className="p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#F1D7AE] font-sans">HF_API_TOKEN</span>
              <span className="px-2 py-0.5 rounded bg-[#171717] text-[11px] text-[#A5A19C] border border-[#303030]">
                Server-side Secret (Redacted)
              </span>
            </div>
            <p className="text-[11px] text-[#A5A19C] leading-relaxed font-sans">
              API tokens are loaded exclusively on the backend from <code>.env</code> and are never transmitted to the browser or committed to repository tracking.
            </p>
          </div>
        </div>

        {/* Privacy & Prompt Logging */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4 text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-[#282828] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#78c291]" />
            <h2 className="text-sm font-medium text-[#F1D7AE]">Privacy & Prompt Logging Policy</h2>
          </div>

          <div className="p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-[#F1D7AE] font-semibold font-sans">
              <Lock className="w-3.5 h-3.5 text-[#C6915A]" />
              <span>Prompt Truncation & Header Stripping</span>
            </div>
            <p className="text-[11px] text-[#A5A19C] leading-relaxed font-sans">
              Prompts recorded in operational telemetry are truncated to 250 characters by default to minimize storing sensitive customer inputs. Sensitive headers (such as Bearer tokens) are stripped before logging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
