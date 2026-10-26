import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Terminal,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MetricsOverview, AlertItem, RequestLogItem } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewDashboardProps {
  overview: MetricsOverview | null;
  alerts: AlertItem[];
  recentLogs: RequestLogItem[];
  isLoading: boolean;
  onNavigate: (page: string) => void;
  onOpenDeployModal: () => void;
  onAcknowledgeAlert: (id: number) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  overview,
  alerts,
  recentLogs,
  isLoading,
  onNavigate,
  onOpenDeployModal,
  onAcknowledgeAlert
}) => {
  const summary = overview?.summary;
  const timeseries = overview?.timeseries || [];
  const modelStats = overview?.models || [];
  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Cinematic Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#181818] via-[#121212] to-[#0d0d0d] border border-[#303030] p-8 md:p-10 shadow-lumen">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-24 right-0 w-96 h-96 bg-[#C6915A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1711] border border-[#C6915A]/30 text-xs font-mono text-[#C6915A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6915A] animate-pulse" />
            <span>Telemetry Engine Active &middot; {summary?.requests_per_minute || 0} req/min</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-[#F1D7AE]">
            Intelligence, under control.
          </h1>

          <p className="text-sm sm:text-base text-[#A5A19C] font-normal leading-relaxed max-w-2xl">
            Deploy models. Observe performance. Improve reliability. Real-time telemetry, exact latency percentiles, and automated threshold alerts for your generative workloads.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C6915A] hover:bg-[#B4804B] text-[#060606] font-semibold text-xs tracking-wide transition shadow-lumen-glow"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deploy Model</span>
            </button>

            <button
              onClick={() => onNavigate('playground')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#383838] hover:border-[#C6915A] text-[#F1D7AE] font-medium text-xs tracking-wide transition"
            >
              <Terminal className="w-4 h-4 text-[#C6915A]" />
              <span>Open Playground</span>
            </button>

            <div className="ml-auto hidden md:flex items-center gap-3 text-xs font-mono text-[#A5A19C] border-l border-[#2e2e2e] pl-4">
              <span>Database: <strong className="text-[#F1D7AE] font-normal">SQLite/Postgres</strong></span>
              <span>&middot;</span>
              <span>Lookback: <strong className="text-[#F1D7AE] font-normal">Rolling 24h</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inference Requests"
          value={(summary?.total_requests || 0).toLocaleString()}
          subtitle={`${summary?.successful_requests || 0} succeeded · ${summary?.failed_requests || 0} failed`}
          icon={Activity}
          badge={`${summary?.success_rate || 100}% Success`}
          badgeColor={summary && summary.error_rate > 10 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Average Latency"
          value={`${summary?.avg_latency_ms || 0} ms`}
          subtitle={`P95 Latency: ${summary?.p95_latency_ms || 0} ms (Min: ${summary?.min_latency_ms || 0}ms)`}
          icon={Clock}
          badge={summary && summary.p95_latency_ms > 2000 ? 'Spike' : 'Nominal'}
          badgeColor={summary && summary.p95_latency_ms > 2000 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Error Rate"
          value={`${summary?.error_rate || 0}%`}
          subtitle={summary && summary.failed_requests > 0 ? `${summary.failed_requests} failed requests recorded` : 'Zero inference failures recorded'}
          icon={ShieldAlert}
          badge={summary && summary.error_rate > 10 ? 'High' : 'Stable'}
          badgeColor={summary && summary.error_rate > 10 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Active Models"
          value={summary?.active_models_count || 0}
          subtitle={`Total tokens: ${(summary?.total_tokens || 0).toLocaleString()} ($${(summary?.estimated_cost_usd || 0).toFixed(4)} est)`}
          icon={Layers}
          badge={`${activeAlerts.length} Alerts`}
          badgeColor={activeAlerts.length > 0 ? 'rose' : 'bronze'}
        />
      </section>

      {/* 3. Main Monitoring Area: Large Chart & Model Health Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Inference-Traffic & Latency Chart */}
        <div className="lg:col-span-2 bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#A5A19C] block">
                Telemetry Series
              </span>
              <h2 className="text-lg font-light text-[#F1D7AE] mt-0.5">
                Inference Traffic & Performance Profile
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#A5A19C]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C6915A]" /> Requests
              </span>
              <span className="inline-flex items-center gap-1.5 ml-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#e07d7d]" /> Failures
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="bronzeFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6915A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C6915A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="roseFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e07d7d" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#e07d7d" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="timestamp" stroke="#666666" fontSize={11} tickLine={false} />
                  <YAxis stroke="#666666" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#303030',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#F1D7AE',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    name="Successful Inferences"
                    stroke="#C6915A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#bronzeFlow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Failed Inferences"
                    stroke="#e07d7d"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#roseFlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#A5A19C] border border-dashed border-[#262626] rounded-lg">
                No telemetry data points recorded yet. Run a prompt in the Playground to begin logging.
              </div>
            )}
          </div>
        </div>

        {/* Model Health Panel */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#282828]">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#A5A19C] block">
                  Cluster State
                </span>
                <h3 className="text-base font-light text-[#F1D7AE] mt-0.5">Model Fleet Health</h3>
              </div>
              <button
                onClick={() => onNavigate('models')}
                className="text-xs text-[#C6915A] hover:text-[#E8B987] font-medium flex items-center gap-1"
              >
                <span>Gallery</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {modelStats.length > 0 ? (
                modelStats.slice(0, 4).map((m) => (
                  <div key={m.model_id} className="p-3 bg-[#111111] border border-[#262626] rounded-lg flex items-center justify-between text-xs">
                    <div className="truncate max-w-[170px]">
                      <div className="font-medium text-[#F1D7AE] truncate">{m.model_id.split('/').pop()}</div>
                      <div className="text-[10px] text-[#A5A19C] font-mono uppercase mt-0.5">{m.provider} &middot; {m.total_requests} reqs</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-[#C6915A]">{m.avg_latency_ms}ms</span>
                      <StatusBadge status={m.health_status || 'healthy'} size="sm" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#A5A19C]">
                  No configured models found in registry.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between text-[11px] text-[#A5A19C] font-mono">
            <span>Fleet Status</span>
            <span className="text-[#78c291] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#78c291]" /> All Endpoints Responsive
            </span>
          </div>
        </div>
      </section>

      {/* 4. Bottom Grid: Recent Invocations & Compact Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invocations Table */}
        <div className="lg:col-span-2 bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#282828]">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#A5A19C] block">
                Audited Feed
              </span>
              <h3 className="text-base font-light text-[#F1D7AE] mt-0.5">Recent Invocations</h3>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-[#C6915A] hover:text-[#E8B987] font-medium flex items-center gap-1"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] border-b border-[#262626]">
                  <tr>
                    <th className="pb-2">Model</th>
                    <th className="pb-2">Provider</th>
                    <th className="pb-2">Timestamp (UTC)</th>
                    <th className="pb-2">Latency</th>
                    <th className="pb-2">Tokens</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222] font-mono text-[11px]">
                  {recentLogs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a1a1a] transition">
                      <td className="py-2.5 text-[#F1D7AE] font-medium truncate max-w-[160px]">
                        {log.model_id.split('/').pop()}
                      </td>
                      <td className="py-2.5 text-[#A5A19C] uppercase">{log.provider}</td>
                      <td className="py-2.5 text-[#A5A19C]">
                        {new Date(log.timestamp).toISOString().replace('T', ' ').slice(11, 19)}
                      </td>
                      <td className="py-2.5 text-[#C6915A]">{log.latency_ms} ms</td>
                      <td className="py-2.5 text-[#A5A19C]">{log.total_tokens}</td>
                      <td className="py-2.5 text-right font-sans">
                        <StatusBadge status={log.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#A5A19C] border border-dashed border-[#262626] rounded-lg">
              No recent requests logged. Submit an inference prompt in the Playground.
            </div>
          )}
        </div>

        {/* Compact Operational Alerts Panel */}
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#282828]">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#A5A19C] block">
                  Threshold Watch
                </span>
                <h3 className="text-base font-light text-[#F1D7AE] mt-0.5">Active Alarms</h3>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-[#C6915A] hover:text-[#E8B987] font-medium"
              >
                All ({alerts.length})
              </button>
            </div>

            {activeAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-3 bg-[#111111] border border-[#2e2620] rounded-lg space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F1D7AE] tracking-tight">{alert.rule_name}</span>
                      <StatusBadge status={alert.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-[#A5A19C] leading-relaxed line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#A5A19C]">
                        Val: {alert.trigger_value} / Limit: {alert.threshold_value}
                      </span>
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="text-[10px] text-[#C6915A] hover:underline"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#A5A19C] border border-dashed border-[#262626] rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-[#78c291] mx-auto mb-2 opacity-80" />
                All operational metrics are within configured safety thresholds.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#262626] text-[11px] text-[#A5A19C] font-mono flex justify-between">
            <span>Rules Active</span>
            <span className="text-[#C6915A]">Error Rate &middot; P95 Latency &middot; Outages</span>
          </div>
        </div>
      </section>
    </div>
  );
};
