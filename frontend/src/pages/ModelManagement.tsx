import React, { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Play,
  Terminal,
  Cpu
} from 'lucide-react';
import { ModelConfig } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface ModelManagementProps {
  models: ModelConfig[];
  onRefresh: () => void;
  onSelectForPlayground: (modelId: string, provider: 'local' | 'hosted' | 'mock') => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const ModelManagement: React.FC<ModelManagementProps> = ({
  models,
  onRefresh,
  onSelectForPlayground,
  isModalOpen,
  setIsModalOpen
}) => {
  const [checkingHealth, setCheckingHealth] = useState<string | null>(null);
  const [healthFeedback, setHealthFeedback] = useState<{ [key: string]: string }>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'mock' | 'hosted' | 'local'>('all');
  const [selectedDetailsModel, setSelectedDetailsModel] = useState<ModelConfig | null>(null);

  // New model form state
  const [newModel, setNewModel] = useState({
    model_id: '',
    name: '',
    provider: 'mock' as 'local' | 'hosted' | 'mock',
    task: 'text-generation',
    endpoint_url: '',
    max_tokens: 150,
    temperature: 0.7
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleHealthCheck = async (modelId: string) => {
    setCheckingHealth(modelId);
    setHealthFeedback(prev => ({ ...prev, [modelId]: 'Testing endpoint...' }));
    try {
      const res = await api.checkModelHealth(modelId);
      setHealthFeedback(prev => ({
        ...prev,
        [modelId]: `Probe: ${res.status.toUpperCase()} (${res.latency_ms}ms) &mdash; ${res.message}`
      }));
      onRefresh();
    } catch (err: any) {
      setHealthFeedback(prev => ({
        ...prev,
        [modelId]: `Probe failed: ${err.message || 'Network error'}`
      }));
    } finally {
      setCheckingHealth(null);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.model_id.trim() || !newModel.name.trim()) {
      setFormError('Model ID and Name are required fields.');
      return;
    }

    try {
      setFormError(null);
      await api.createModel({
        model_id: newModel.model_id.trim(),
        name: newModel.name.trim(),
        provider: newModel.provider,
        task: newModel.task,
        endpoint_url: newModel.endpoint_url.trim() || null,
        max_tokens: Number(newModel.max_tokens),
        temperature: Number(newModel.temperature)
      });
      setIsModalOpen(false);
      setNewModel({
        model_id: '',
        name: '',
        provider: 'mock',
        task: 'text-generation',
        endpoint_url: '',
        max_tokens: 150,
        temperature: 0.7
      });
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register model configuration');
    }
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          m.model_id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesProvider = providerFilter === 'all' || m.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
            Model Gallery & Fleet
          </span>
          <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
            Registered Models
          </h1>
          <p className="text-xs text-[#A5A19C] mt-1">
            Architectural model discovery panels with latency profiles, provider telemetry, and endpoint probing.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#060606] bg-[#C6915A] hover:bg-[#B4804B] rounded-lg transition shadow-lumen-glow self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Model</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#171717] border border-[#303030] rounded-xl p-3 shadow-lumen">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#A5A19C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by model name or Hugging Face ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0e0e0e] border border-[#2b2b2b] rounded-lg text-xs text-[#F1D7AE] placeholder:text-[#666] font-mono focus:outline-none"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
          {(['all', 'mock', 'hosted', 'local'] as const).map(p => (
            <button
              key={p}
              onClick={() => setProviderFilter(p)}
              className={`px-3 py-1 rounded-lg capitalize font-mono text-[11px] transition ${
                providerFilter === p
                  ? 'bg-[#2b2016] text-[#C6915A] border border-[#C6915A]/40'
                  : 'text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] border border-[#262626]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((model) => {
          const isProbing = checkingHealth === model.model_id;
          const feedback = healthFeedback[model.model_id];

          return (
            <div
              key={model.id}
              className="group bg-[#171717] border border-[#303030] hover:border-[#444444] rounded-xl p-6 transition duration-200 shadow-lumen flex flex-col justify-between"
            >
              <div>
                {/* Top: Name & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#C6915A] block mb-1">
                      {model.provider} &middot; {model.task}
                    </span>
                    <h3 className="text-base font-normal text-[#F1D7AE] tracking-tight group-hover:text-white transition">
                      {model.name}
                    </h3>
                    <p className="font-mono text-[11px] text-[#A5A19C] mt-0.5 truncate max-w-[200px]">
                      {model.model_id}
                    </p>
                  </div>
                  <StatusBadge status={model.status} size="sm" />
                </div>

                {/* Architectural Specs Box */}
                <div className="my-4 p-3 bg-[#0f0f0f] border border-[#242424] rounded-lg grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-[#666666] block">Max Tokens</span>
                    <span className="text-[#F1D7AE]">{model.max_tokens}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#666666] block">Temperature</span>
                    <span className="text-[#F1D7AE]">{model.temperature.toFixed(2)}</span>
                  </div>
                </div>

                {/* Probe feedback if present */}
                {feedback && (
                  <div className="p-2 mb-3 bg-[#1e1711] border border-[#3d2b1d] rounded text-[11px] font-mono text-[#C6915A]">
                    {feedback}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#242424] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDetailsModel(model)}
                  className="px-2.5 py-1.5 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg transition"
                >
                  View Details
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleHealthCheck(model.model_id)}
                    disabled={isProbing}
                    className="p-1.5 text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] hover:bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg transition disabled:opacity-50"
                    title="Probe endpoint"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-[#C6915A]' : ''}`} />
                  </button>

                  <button
                    onClick={() => onSelectForPlayground(model.model_id, model.provider)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#060606] bg-[#C6915A] hover:bg-[#B4804B] rounded-lg transition"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModels.length === 0 && (
        <div className="p-12 text-center text-xs text-[#A5A19C] bg-[#171717] border border-[#303030] rounded-xl">
          <Cpu className="w-8 h-8 text-[#A5A19C] mx-auto mb-2 opacity-50" />
          No models found matching the search criteria.
        </div>
      )}

      {/* View Details Drawer/Modal */}
      {selectedDetailsModel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#303030] rounded-xl max-w-lg w-full p-6 shadow-lumen space-y-4 text-xs font-mono">
            <div className="flex items-start justify-between border-b border-[#282828] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C6915A]">Model Specification</span>
                <h3 className="text-base font-normal text-[#F1D7AE] mt-0.5">{selectedDetailsModel.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDetailsModel(null)}
                className="px-2.5 py-1 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] border border-[#2e2e2e] rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-[#A5A19C] text-[11px]">
              <div><strong>Hugging Face Repo:</strong> <span className="text-[#F1D7AE]">{selectedDetailsModel.model_id}</span></div>
              <div><strong>Provider:</strong> <span className="text-[#C6915A] uppercase">{selectedDetailsModel.provider}</span></div>
              <div><strong>Task Architecture:</strong> <span className="text-[#F1D7AE]">{selectedDetailsModel.task}</span></div>
              <div><strong>Endpoint URL:</strong> <span className="text-[#F1D7AE]">{selectedDetailsModel.endpoint_url || 'Default Cloud Router'}</span></div>
              <div><strong>Status:</strong> <span className="text-[#78c291]">{selectedDetailsModel.status}</span></div>
              <div><strong>Health Status:</strong> <span className="text-[#F1D7AE]">{selectedDetailsModel.health_status}</span></div>
              <div><strong>Registered At:</strong> <span className="text-[#F1D7AE]">{new Date(selectedDetailsModel.created_at).toISOString()}</span></div>
            </div>

            <div className="pt-3 border-t border-[#282828] flex justify-end">
              <button
                onClick={() => {
                  const m = selectedDetailsModel;
                  setSelectedDetailsModel(null);
                  onSelectForPlayground(m.model_id, m.provider);
                }}
                className="px-4 py-2 bg-[#C6915A] text-[#060606] font-semibold rounded-lg text-xs"
              >
                Launch in Playground
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Model Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#303030] rounded-xl max-w-lg w-full p-6 shadow-lumen">
            <h2 className="text-lg font-light text-[#F1D7AE] mb-1">Register New Model</h2>
            <p className="text-xs text-[#A5A19C] mb-4">
              Add a Hugging Face model identifier for local inference, cloud router, or mock simulation.
            </p>

            {formError && (
              <div className="p-3 mb-4 bg-[#281818] border border-[#472626] rounded-lg text-xs text-[#e07d7d]">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateModel} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#A5A19C] mb-1">Model Identifier (Hugging Face ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. distilbert/distilgpt2 or custom-model"
                  value={newModel.model_id}
                  onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] placeholder:text-[#555] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A5A19C] mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DistilGPT-2 Local"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] placeholder:text-[#555] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5A19C] mb-1">Provider</label>
                  <select
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                  >
                    <option value="mock">Mock Simulator</option>
                    <option value="hosted">Hosted Hugging Face Router</option>
                    <option value="local">Local Transformers Engine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A5A19C] mb-1">Task</label>
                  <input
                    type="text"
                    value={newModel.task}
                    onChange={(e) => setNewModel({ ...newModel, task: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5A19C] mb-1">Custom Endpoint URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newModel.endpoint_url}
                  onChange={(e) => setNewModel({ ...newModel, endpoint_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] placeholder:text-[#555] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5A19C] mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min={10}
                    max={2048}
                    value={newModel.max_tokens}
                    onChange={(e) => setNewModel({ ...newModel, max_tokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A5A19C] mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={2.0}
                    value={newModel.temperature}
                    onChange={(e) => setNewModel({ ...newModel, temperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#A5A19C] hover:text-[#F1D7AE] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#C6915A] hover:bg-[#B4804B] text-[#060606] font-semibold transition"
                >
                  Deploy Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
