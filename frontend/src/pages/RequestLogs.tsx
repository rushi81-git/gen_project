import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { RequestLogItem, ModelConfig } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface RequestLogsProps {
  models: ModelConfig[];
}

export const RequestLogs: React.FC<RequestLogsProps> = ({ models }) => {
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected for inspection drawer
  const [selectedLog, setSelectedLog] = useState<RequestLogItem | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLogs({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        model_id: modelFilter || undefined,
        search: searchTerm.trim() || undefined
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch request logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, providerFilter, modelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCSV = () => {
    const url = api.getExportUrl(modelFilter || undefined, statusFilter || undefined);
    window.open(url, '_blank');
  };

  // Group logs into simple distribution for mini-bar chart
  const latencyDistribution = logs.slice(0, 10).map((l, i) => ({
    name: `#${i + 1}`,
    latency: l.latency_ms,
    tokens: l.total_tokens
  }));

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
            Immutable Audit Trail
          </span>
          <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
            Inference Request Logs
          </h1>
          <p className="text-xs text-[#A5A19C] mt-1 font-mono">
            Last polled: {lastUpdated} &middot; Total entries: {total}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#1a1a1a] border border-[#303030] rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C6915A] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#060606] bg-[#C6915A] hover:bg-[#B4804B] rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mini Telemetry Overview Bar Chart */}
      {logs.length > 0 && (
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-5 shadow-lumen">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-[10px] uppercase tracking-wider text-[#A5A19C]">
              Recent 10 Invocations Latency & Token Footprint
            </span>
            <span className="text-[#C6915A]">ms &middot; tokens</span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#555" fontSize={10} />
                <YAxis stroke="#555" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111',
                    borderColor: '#303030',
                    fontSize: '11px',
                    color: '#F1D7AE',
                    fontFamily: 'monospace'
                  }}
                />
                <Bar dataKey="latency" name="Latency (ms)" fill="#C6915A" radius={[2, 2, 0, 0]} />
                <Bar dataKey="tokens" name="Tokens" fill="#A5A19C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#171717] border border-[#303030] rounded-xl p-4 shadow-lumen flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#A5A19C] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search prompt, error, or request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] placeholder:text-[#555] text-xs focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#1a1a1a] text-[#F1D7AE] rounded-lg border border-[#303030]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Provider filter */}
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
          >
            <option value="">Provider: All</option>
            <option value="mock">Mock</option>
            <option value="hosted">Hosted</option>
            <option value="local">Local</option>
          </select>

          {/* Model filter */}
          <select
            value={modelFilter}
            onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none max-w-[160px] truncate"
          >
            <option value="">Model: All</option>
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#171717] border border-[#303030] rounded-xl overflow-hidden shadow-lumen">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111111] text-[#A5A19C] uppercase font-mono text-[10px] tracking-wider border-b border-[#282828]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Model ID</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Cost (Est)</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] font-mono text-[11px]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1d1d1d] transition">
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={log.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#A5A19C] whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F1D7AE] max-w-[180px] truncate">
                      {log.model_id.split('/').pop()}
                    </td>
                    <td className="py-3 px-4 text-[#A5A19C] uppercase">
                      {log.provider}
                    </td>
                    <td className="py-3 px-4 text-[#C6915A]">
                      {log.latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-[#A5A19C]">
                      {log.total_tokens} {log.tokens_estimated ? '(est)' : ''}
                    </td>
                    <td className="py-3 px-4 text-[#78c291]">
                      ${log.estimated_cost_usd.toFixed(5)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#222222] border border-[#2e2e2e] rounded transition"
                        title="Inspect trace"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A5A19C]">
                    {isLoading ? 'Loading records...' : 'No telemetry request logs found matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#282828] flex items-center justify-between text-xs font-mono text-[#A5A19C]">
          <div>
            Showing <strong className="text-[#F1D7AE] font-normal">{logs.length}</strong> of <strong className="text-[#F1D7AE] font-normal">{total}</strong> total logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 bg-[#111111] hover:bg-[#1d1d1d] border border-[#303030] rounded text-[#A5A19C] disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <strong className="text-[#F1D7AE] font-normal">{page}</strong> of <strong className="text-[#F1D7AE] font-normal">{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 bg-[#111111] hover:bg-[#1d1d1d] border border-[#303030] rounded text-[#A5A19C] disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#303030] rounded-xl max-w-2xl w-full p-6 shadow-lumen space-y-4 max-h-[90vh] overflow-y-auto text-xs font-mono">
            <div className="flex items-start justify-between border-b border-[#282828] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C6915A]">Telemetry Trace</span>
                <h2 className="text-base font-light text-[#F1D7AE] flex items-center gap-2 mt-0.5">
                  <span>{selectedLog.model_id}</span>
                  <StatusBadge status={selectedLog.status} size="sm" />
                </h2>
                <p className="text-[10px] text-[#666] mt-1">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-2.5 py-1 text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111] border border-[#2e2e2e] rounded"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <div>
                <span className="text-[10px] text-[#666] block uppercase">Provider</span>
                <span className="text-[#F1D7AE]">{selectedLog.provider}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666] block uppercase">Latency</span>
                <span className="text-[#C6915A]">{selectedLog.latency_ms} ms</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666] block uppercase">Tokens (P/C/T)</span>
                <span className="text-[#F1D7AE]">{selectedLog.prompt_tokens}/{selectedLog.completion_tokens}/{selectedLog.total_tokens}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666] block uppercase">Est. Cost</span>
                <span className="text-[#78c291]">${selectedLog.estimated_cost_usd.toFixed(6)}</span>
              </div>
            </div>

            {/* Prompt preview */}
            <div>
              <span className="text-[#A5A19C] block mb-1 text-[11px]">Prompt Text Sample</span>
              <div className="p-3 bg-[#0e0e0e] border border-[#242424] rounded-lg text-[#F1D7AE] text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedLog.prompt_preview || '[Empty]'}
              </div>
            </div>

            {/* Response preview */}
            {selectedLog.response_preview && (
              <div>
                <span className="text-[#A5A19C] block mb-1 text-[11px]">Output Text Sample</span>
                <div className="p-3 bg-[#0e0e0e] border border-[#242424] rounded-lg text-[#F1D7AE] text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedLog.response_preview}
                </div>
              </div>
            )}

            {/* Error diagnosis */}
            {selectedLog.sanitized_error && (
              <div>
                <span className="text-[#e07d7d] block mb-1 text-[11px]">Sanitized Diagnostics</span>
                <div className="p-3 bg-[#281818] border border-[#472626] rounded-lg text-[#e07d7d] text-[11px] whitespace-pre-wrap">
                  {selectedLog.error_type ? `[${selectedLog.error_type}] ` : ''}
                  {selectedLog.sanitized_error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
