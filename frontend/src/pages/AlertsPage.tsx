import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Clock,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { AlertItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface AlertsPageProps {
  alerts: AlertItem[];
  onRefresh: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'active').length;

  const handleStatusChange = async (alertId: number, newStatus: 'acknowledged' | 'resolved') => {
    setUpdatingId(alertId);
    try {
      await api.updateAlertStatus(alertId, newStatus);
      onRefresh();
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
            Incident Prevention
          </span>
          <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
            Operational Alerts
          </h1>
          <p className="text-xs text-[#A5A19C] mt-1 font-mono">
            Automated threshold monitors evaluating error rates, latency spikes, and consecutive downtime.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#1a1a1a] border border-[#303030] rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C6915A]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] block">Critical Alarms</span>
            <span className="text-3xl font-light text-[#e07d7d] mt-1 block">{criticalCount}</span>
          </div>
          <div className="p-2.5 bg-[#281818] border border-[#472626] rounded-lg text-[#e07d7d]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] block">Warning Alarms</span>
            <span className="text-3xl font-light text-[#C6915A] mt-1 block">{warningCount}</span>
          </div>
          <div className="p-2.5 bg-[#261f17] border border-[#423322] rounded-lg text-[#C6915A]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] block">Total Incidents</span>
            <span className="text-3xl font-light text-[#F1D7AE] mt-1 block">{alerts.length}</span>
          </div>
          <div className="p-2.5 bg-[#111111] border border-[#2b2b2b] rounded-lg text-[#A5A19C]">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Threshold Policies Reference Banner */}
      <div className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen space-y-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#C6915A] font-semibold text-xs">
          <Sliders className="w-4 h-4" />
          <span>Configured Threshold Bounds</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#A5A19C] text-[11px]">
          <div className="p-3 bg-[#0e0e0e] rounded border border-[#242424]">
            <strong className="text-[#F1D7AE] block mb-0.5">High Error Rate:</strong>
            Fires when failure rate in recent 50 requests exceeds <strong>10.0%</strong>.
          </div>
          <div className="p-3 bg-[#0e0e0e] rounded border border-[#242424]">
            <strong className="text-[#F1D7AE] block mb-0.5">Consecutive Failures:</strong>
            Fires when <strong>3 consecutive requests</strong> fail across any provider.
          </div>
          <div className="p-3 bg-[#0e0e0e] rounded border border-[#242424]">
            <strong className="text-[#F1D7AE] block mb-0.5">High P95 Latency:</strong>
            Fires when rolling 95th percentile latency exceeds <strong>2,500 ms</strong>.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#303030] pb-2 text-xs font-mono">
        {(['all', 'active', 'acknowledged', 'resolved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition ${
              filter === tab
                ? 'bg-[#2b2016] text-[#C6915A] border border-[#C6915A]/40'
                : 'text-[#A5A19C] hover:text-[#F1D7AE] hover:bg-[#151515]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3 font-mono">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const isUpdating = updatingId === alert.id;
            return (
              <div
                key={alert.id}
                className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} size="sm" />
                    <span className="font-semibold text-[#F1D7AE] text-sm">{alert.rule_name}</span>
                    <span className="text-[#666] text-[10px]">
                      {new Date(alert.created_at).toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </span>
                  </div>
                  <p className="text-[#A5A19C] leading-relaxed font-sans">{alert.message}</p>
                  <div className="flex items-center gap-4 text-[10px] text-[#A5A19C]">
                    <span>Trigger: <strong className="text-[#e07d7d]">{alert.trigger_value}</strong></span>
                    <span>Limit: <strong className="text-[#F1D7AE]">{alert.threshold_value}</strong></span>
                    <span>Status: <strong className="capitalize text-[#C6915A]">{alert.status}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-sans">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#202020] text-[#A5A19C] hover:text-[#F1D7AE] border border-[#303030] text-xs transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'resolved')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-[#152319] hover:bg-[#1e3324] border border-[#223d2b] text-[#78c291] text-xs transition"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-xs text-[#A5A19C] bg-[#171717] border border-[#303030] rounded-xl font-mono">
            <CheckCircle2 className="w-8 h-8 text-[#78c291] mx-auto mb-2 opacity-80" />
            No alerts found matching the '{filter}' criteria.
          </div>
        )}
      </div>
    </div>
  );
};
