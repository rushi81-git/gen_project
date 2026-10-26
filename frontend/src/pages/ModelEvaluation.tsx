import React, { useState, useEffect } from 'react';
import {
  Award,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { ModelConfig, EvaluationResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface ModelEvaluationProps {
  models: ModelConfig[];
}

export const ModelEvaluation: React.FC<ModelEvaluationProps> = ({ models }) => {
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.model_id || 'mock-gpt-fast');
  const [selectedProvider, setSelectedProvider] = useState<'mock' | 'hosted' | 'local'>('mock');
  const [isRunning, setIsRunning] = useState(false);
  const [latestEval, setLatestEval] = useState<EvaluationResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const runs = await api.getEvaluations();
      setHistory(runs);
    } catch (err) {
      console.error('Failed to fetch evaluations:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await api.runEvaluation({
        model_id: selectedModelId,
        provider: selectedProvider,
        dataset_name: 'standard_qa_benchmark'
      });
      setLatestEval(res);
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation benchmark run failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="pb-4 border-b border-[#303030]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5A19C] block">
          Quality Governance
        </span>
        <h1 className="text-3xl font-light text-[#F1D7AE] tracking-tight mt-1">
          Response Quality & Evaluation
        </h1>
        <p className="text-xs text-[#A5A19C] mt-1 font-mono">
          Deterministic scoring benchmark testing response completeness, expected keywords, and malformed rates.
        </p>
      </div>

      {/* Runner Bar */}
      <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4">
        <h2 className="text-sm font-medium text-[#F1D7AE]">Standard QA & Instruction Adherence Suite</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[#A5A19C] mb-1 uppercase text-[10px]">Target Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => {
                setSelectedModelId(e.target.value);
                const found = models.find(m => m.model_id === e.target.value);
                if (found) setSelectedProvider(found.provider as any);
              }}
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
            <label className="block text-[#A5A19C] mb-1 uppercase text-[10px]">Execution Mode</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#303030] rounded-lg text-[#F1D7AE] focus:outline-none"
            >
              <option value="mock">Mock Simulator</option>
              <option value="hosted">Hosted Hugging Face Router</option>
              <option value="local">Local Transformers Pipeline</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunEvaluation}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#C6915A] hover:bg-[#B4804B] text-[#060606] font-semibold rounded-lg text-xs tracking-wide transition shadow-lumen-glow disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#281818] border border-[#472626] rounded-lg text-xs font-mono text-[#e07d7d]">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Latest Evaluation Results Scorecard */}
      {latestEval && (
        <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282828] pb-3 font-mono">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#C6915A]">Benchmark Assessment</span>
              <h3 className="text-base font-normal text-[#F1D7AE] mt-0.5">{latestEval.model_id}</h3>
            </div>
            <span className="text-xs text-[#A5A19C]">
              {new Date(latestEval.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>

          {/* Scores Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <span className="text-[10px] text-[#A5A19C] uppercase block">Pass Rate</span>
              <span className={`text-2xl font-light mt-1 block ${latestEval.pass_rate >= 75 ? 'text-[#78c291]' : 'text-[#C6915A]'}`}>
                {latestEval.pass_rate}%
              </span>
              <span className="text-[10px] text-[#666] block mt-0.5">
                {latestEval.passed_prompts} / {latestEval.total_prompts} cases passed
              </span>
            </div>

            <div className="p-4 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <span className="text-[10px] text-[#A5A19C] uppercase block">Completeness</span>
              <span className="text-2xl font-light text-[#F1D7AE] mt-1 block">
                {(latestEval.avg_completeness * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-[#666] block mt-0.5">
                Keyword & length match
              </span>
            </div>

            <div className="p-4 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <span className="text-[10px] text-[#A5A19C] uppercase block">Avg Latency</span>
              <span className="text-2xl font-light text-[#C6915A] mt-1 block">
                {latestEval.avg_latency_ms} ms
              </span>
              <span className="text-[10px] text-[#666] block mt-0.5">
                Per benchmark test
              </span>
            </div>

            <div className="p-4 bg-[#0e0e0e] border border-[#242424] rounded-lg">
              <span className="text-[10px] text-[#A5A19C] uppercase block">Malformed</span>
              <span className={`text-2xl font-light mt-1 block ${latestEval.empty_or_malformed_count === 0 ? 'text-[#78c291]' : 'text-[#e07d7d]'}`}>
                {latestEval.empty_or_malformed_count}
              </span>
              <span className="text-[10px] text-[#666] block mt-0.5">
                Empty outputs
              </span>
            </div>
          </div>

          {/* Detailed Prompt Cases Table */}
          <div className="overflow-x-auto border border-[#242424] rounded-lg font-mono">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] text-[#A5A19C] uppercase text-[10px] border-b border-[#282828]">
                <tr>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Test Prompt</th>
                  <th className="py-2.5 px-3">Target Keywords</th>
                  <th className="py-2.5 px-3">Output Text</th>
                  <th className="py-2.5 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-[11px]">
                {latestEval.details.map((detail, idx) => (
                  <tr key={idx} className="hover:bg-[#1a1a1a]">
                    <td className="py-2.5 px-3">
                      {detail.passed ? (
                        <span className="inline-flex items-center gap-1 text-[#78c291]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#e07d7d]">
                          <XCircle className="w-3.5 h-3.5" /> Fail
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#F1D7AE] max-w-xs truncate font-sans">
                      {detail.prompt}
                    </td>
                    <td className="py-2.5 px-3 text-[#A5A19C] text-[10px]">
                      {detail.expected_contains.join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-[#A5A19C] max-w-sm truncate text-[10px]">
                      {detail.generated_text}
                    </td>
                    <td className="py-2.5 px-3 text-[#C6915A]">
                      {detail.latency_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Runs */}
      <div className="bg-[#171717] border border-[#303030] rounded-xl p-6 shadow-lumen space-y-4">
        <h3 className="text-sm font-medium text-[#F1D7AE]">Historical Benchmark Runs</h3>
        {history.length > 0 ? (
          <div className="space-y-2.5 text-xs font-mono">
            {history.map((run) => (
              <div key={run.id} className="p-3.5 bg-[#111111] border border-[#262626] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#F1D7AE]">{run.model_id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 uppercase bg-[#1e1711] border border-[#C6915A]/30 rounded text-[#C6915A]">
                      {run.provider}
                    </span>
                  </div>
                  <span className="text-[#666] text-[10px] mt-0.5 block">
                    {new Date(run.timestamp).toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span>Pass: <strong className={run.pass_rate >= 75 ? 'text-[#78c291]' : 'text-[#C6915A]'}>{run.pass_rate}%</strong></span>
                  <span>Completeness: <strong className="text-[#F1D7AE]">{(run.avg_completeness * 100).toFixed(0)}%</strong></span>
                  <span>Latency: <strong className="text-[#C6915A]">{run.avg_latency_ms} ms</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#A5A19C] border border-dashed border-[#262626] rounded-lg font-mono">
            No historical benchmark runs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
