import {
  ModelConfig,
  GenerationRequest,
  GenerationResponse,
  MetricsOverview,
  MetricsSummary,
  TimeSeriesPoint,
  ModelComparisonItem,
  PaginatedLogsResponse,
  RequestLogItem,
  AlertItem,
  EvaluationResponse,
  HealthCheckResult,
  SystemReadyResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // System
  getHealth: () => request<{ status: string; service: string; timestamp: string }>('/health'),
  getReady: () => request<SystemReadyResponse>('/ready'),

  // Models
  getModels: () => request<ModelConfig[]>('/models'),
  createModel: (model: Partial<ModelConfig>) => request<ModelConfig>('/models', {
    method: 'POST',
    body: JSON.stringify(model)
  }),
  updateModel: (modelId: string, update: Partial<ModelConfig>) => request<ModelConfig>(`/models/${modelId}`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  }),
  checkModelHealth: (modelId: string) => request<HealthCheckResult>(`/models/${modelId}/health-check`, {
    method: 'POST'
  }),

  // Generation
  generate: (req: GenerationRequest) => request<GenerationResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(req)
  }),

  // Metrics
  getMetricsOverview: () => request<MetricsOverview>('/metrics/overview'),
  getMetricsSummary: () => request<MetricsSummary>('/metrics/summary'),
  getMetricsTimeseries: (hours = 24, intervals = 12) => request<TimeSeriesPoint[]>(`/metrics/timeseries?hours=${hours}&intervals=${intervals}`),
  getModelComparison: () => request<ModelComparisonItem[]>('/metrics/models'),

  // Logs
  getLogs: (params?: {
    page?: number;
    page_size?: number;
    model_id?: string;
    provider?: string;
    status?: string;
    min_latency?: number;
    max_latency?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.model_id) query.append('model_id', params.model_id);
    if (params?.provider) query.append('provider', params.provider);
    if (params?.status) query.append('status', params.status);
    if (params?.min_latency !== undefined) query.append('min_latency', params.min_latency.toString());
    if (params?.max_latency !== undefined) query.append('max_latency', params.max_latency.toString());
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return request<PaginatedLogsResponse>(`/logs${qs ? `?${qs}` : ''}`);
  },
  getLogById: (id: string) => request<RequestLogItem>(`/logs/${id}`),
  getExportUrl: (modelId?: string, status?: string) => {
    const q = new URLSearchParams();
    if (modelId) q.append('model_id', modelId);
    if (status) q.append('status', status);
    const qs = q.toString();
    return `${API_BASE}/logs/export${qs ? `?${qs}` : ''}`;
  },

  // Alerts
  getAlerts: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<AlertItem[]>(`/alerts${q}`);
  },
  updateAlertStatus: (alertId: number, status: 'active' | 'acknowledged' | 'resolved') =>
    request<AlertItem>(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Evaluations
  getEvaluations: () => request<any[]>('/evaluations'),
  runEvaluation: (payload: { model_id: string; provider: string; dataset_name?: string }) =>
    request<EvaluationResponse>('/evaluations/run', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
