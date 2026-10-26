import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Trash2,
  Copy,
  Check,
  Clock,
  Zap,
  Coins,
  AlertCircle,
  Sliders,
  Sparkles,
  StopCircle
} from 'lucide-react';
import { ModelConfig, GenerationResponse } from '../types';
import { api } from '../services/api';

interface ModelPlaygroundProps {
  models: ModelConfig[];
  initialModelId?: string;
  initialProvider?: 'local' | 'hosted' | 'mock';
  onExecutionCompleted: () => void;
}

export const ModelPlayground: React.FC<ModelPlaygroundProps> = ({
  models,
  initialModelId,
  initialProvider,
  onExecutionCompleted
}) => {
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || (models[0]?.model_id || 'mock-gpt-fast'));
  const [selectedProvider, setSelectedProvider] = useState<'local' | 'hosted' | 'mock'>(
    initialProvider || (models[0]?.provider || 'mock')
  );
  const [systemPrompt, setSystemPrompt] = useState('You are an expert AI software architect and system engineer. Provide clear, accurate, and concise insights.');
  const [prompt, setPrompt] = useState('Explain the architectural advantages of distributed tracing and P95 latency percentiles over standard averages.');
  const [maxTokens, setMaxTokens] = useState(150);
  const [temperature, setTemperature] = useState(0.7);

  // Testing switches
  const [simulateDelayMs, setSimulateDelayMs] = useState(0);
  const [simulateError, setSimulateError] = useState(false);

  // Execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const found = models.find(m => m.model_id === modelId);
    if (found) {
      setSelectedProvider(found.provider);
      setMaxTokens(found.max_tokens || 150);
      setTemperature(found.temperature || 0.7);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    // Combine system prompt and user prompt
    const fullPrompt = systemPrompt.trim()
      ? `System: ${systemPrompt.trim()}\n\nUser: ${prompt.trim()}`
      : prompt.trim();

    try {
      const response = await api.generate({
        model_id: selectedModelId,
        provider: selectedProvider,
        prompt: fullPrompt,
        max_tokens: maxTokens,
        temperature: temperature,
        simulate_delay_ms: simulateDelayMs,
        simulate_error: simulateError
      });
      setResult(response);
      onExecutionCompleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Model execution failed');
      onExecutionCompleted();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.generated_text) return;
    navigator.clipboard.writeText(result.generated_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setPrompt('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="pb-4 border-b border-[#303030]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
          Distraction-Free Environment
        </span>
        <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
          Prompt Playground
        </h1>
        <p className="text-xs text-[#A5A19C] mt-1">
          Test system instructions, execute generation prompts, and observe real latency and token usage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Prompt Editor & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-5">
            {/* Model & Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[#A5A19C] uppercase text-[10px] tracking-wider mb-1">
                  Target Model
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                >
                  {models.map(m => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A5A19C] uppercase text-[10px] tracking-wider mb-1">
                  Execution Mode
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
                >
                  <option value="mock">Mock Simulator (Testing)</option>
                  <option value="hosted">Hosted Hugging Face Router</option>
                  <option value="local">Local Transformers Engine</option>
                </select>
              </div>
            </div>

            {/* System Prompt Editor */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] mb-1">
                <span>System Instruction</span>
                <span>Context Definition</span>
              </div>
              <textarea
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional system context instructions..."
                className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-[#2b2b2b] rounded-lg text-[#A5A19C] font-mono text-xs focus:text-[#F1D7AE] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* User Prompt Input */}
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[#A5A19C] mb-1">
                <span>User Prompt</span>
                <span>{prompt.length} / 10,000 chars</span>
              </div>
              <textarea
                rows={6}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter prompt to execute..."
                className="w-full px-4 py-3 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] font-mono text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Generation Parameters */}
            <div className="p-4 bg-[#0e0e0e] border border-[#262626] rounded-lg space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#C6915A]">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Generation Parameters
                </span>
                <span className="text-[#666]">temp &middot; tokens</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#A5A19C]">
                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span>Max Tokens:</span>
                    <span className="text-[#F1D7AE]">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={1024}
                    step={10}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full accent-[#C6915A]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span>Temperature:</span>
                    <span className="text-[#F1D7AE]">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.5}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full accent-[#C6915A]"
                  />
                </div>
              </div>

              {/* Mock testing switches */}
              {selectedProvider === 'mock' && (
                <div className="pt-2 border-t border-[#222222] flex flex-wrap items-center gap-4 text-[11px] text-[#A5A19C]">
                  <div className="flex items-center gap-2">
                    <label>Simulate Delay (ms):</label>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      step={200}
                      value={simulateDelayMs}
                      onChange={(e) => setSimulateDelayMs(Number(e.target.value))}
                      className="w-16 px-2 py-0.5 bg-[#171717] border border-[#303030] rounded text-[#F1D7AE] text-center"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#e07d7d]">
                    <input
                      type="checkbox"
                      checked={simulateError}
                      onChange={(e) => setSimulateError(e.target.checked)}
                      className="rounded accent-[#e07d7d]"
                    />
                    <span>Simulate Provider Failure</span>
                  </label>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A5A19C] hover:text-[#F1D7AE] transition font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => setIsGenerating(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#F1D7AE] bg-[#281818] border border-[#472626] rounded-lg transition"
                  >
                    <StopCircle className="w-3.5 h-3.5 text-[#e07d7d]" />
                    <span>Cancel Request</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="flex items-center gap-2 px-6 py-2 text-xs font-semibold text-[#060606] bg-[#C6915A] hover:bg-[#B4804B] rounded-lg transition shadow-lumen-glow disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Generation</span>
                  </button>
                )}
              </div>
            </div>
          </form>

          {errorMessage && (
            <div className="p-4 bg-[#281818] border border-[#472626] rounded-xl text-[#e07d7d] text-xs font-mono flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#e07d7d] shrink-0 mt-0.5" />
              <div>
                <strong>Inference Failure Diagnosed:</strong>
                <p className="mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Output & Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#282828]">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#A5A19C]">
                  Generated Response
                </span>
                {result && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#A5A19C] hover:text-[#F1D7AE] bg-[#111111] border border-[#2e2e2e] rounded transition font-mono"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#78c291]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {result ? (
                <div className="space-y-4">
                  {result.is_mock && (
                    <div className="px-2.5 py-1 bg-[#261f17] border border-[#423322] rounded text-[11px] text-[#C6915A] font-mono">
                      Simulated Response &middot; Mock Provider
                    </div>
                  )}

                  <div className="p-4 bg-[#0e0e0e] border border-[#242424] rounded-lg text-xs font-mono text-[#F1D7AE] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {result.generated_text}
                  </div>

                  {/* Telemetry Breakdown Box */}
                  <div className="p-3.5 bg-[#0e0e0e] border border-[#242424] rounded-lg space-y-2 text-xs font-mono">
                    <div className="text-[10px] uppercase tracking-wider text-[#A5A19C]">
                      Invocation Telemetry
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A5A19C]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C6915A]" />
                        <span>Latency: <strong className="text-[#F1D7AE]">{result.latency_ms} ms</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#C6915A]" />
                        <span>Tokens: <strong className="text-[#F1D7AE]">{result.total_tokens}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#78c291]" />
                        <span>Cost: <strong className="text-[#F1D7AE]">${result.estimated_cost_usd.toFixed(5)}</strong></span>
                      </div>
                      <div className="truncate text-[#666]">
                        ID: {result.request_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#A5A19C] border border-dashed border-[#262626] rounded-lg my-auto font-mono">
                  <Terminal className="w-6 h-6 mx-auto mb-2 text-[#444]" />
                  Awaiting prompt submission to render live model generation.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#262626] text-[10px] text-[#666] font-mono flex justify-between">
              <span>Target: {selectedModelId.split('/').pop()}</span>
              <span className="uppercase">{selectedProvider} mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
