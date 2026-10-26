export interface ModelConfig {
  id: number;
  model_id: string;
  name: string;
  provider: 'local' | 'hosted' | 'mock';
  task: string;
  endpoint_url?: string | null;
  status: 'configured' | 'loading' | 'ready' | 'degraded' | 'unavailable' | 'failed';
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  last_health_check?: string | null;
  last_error?: string | null;
  max_tokens: number;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export interface GenerationRequest {
  model_id: string;
  prompt: string;
  provider: 'local' | 'hosted' | 'mock';
  max_tokens?: number;
  temperature?: number;
  simulate_delay_ms?: number;
  simulate_error?: boolean;
}

export interface GenerationResponse {
  request_id: string;
  model_id: string;
  provider: string;
  execution_mode: string;
  generated_text: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tokens_estimated: boolean;
  estimated_cost_usd: number;
  is_mock: boolean;
  created_at: string;
}

export interface MetricsSummary {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  error_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  requests_per_minute: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  active_models_count: number;
  active_alerts_count: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  success: number;
  failed: number;
  avg_latency_ms: number;
  tokens: number;
}

export interface ModelComparisonItem {
  model_id: string;
  provider: string;
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  total_tokens: number;
  estimated_cost_usd: number;
  health_status: string;
}

export interface MetricsOverview {
  summary: MetricsSummary;
  timeseries: TimeSeriesPoint[];
  models: ModelComparisonItem[];
}

export interface RequestLogItem {
  id: string;
  timestamp: string;
  model_id: string;
  provider: string;
  execution_mode: string;
  status: 'success' | 'failed';
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tokens_estimated: boolean;
  estimated_cost_usd: number;
  prompt_preview?: string | null;
  response_preview?: string | null;
  error_type?: string | null;
  sanitized_error?: string | null;
  http_status?: number | null;
  correlation_id?: string | null;
}

export interface PaginatedLogsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: RequestLogItem[];
}

export interface AlertItem {
  id: number;
  rule_name: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  trigger_value: number;
  threshold_value: number;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string | null;
}

export interface EvaluationDetailItem {
  prompt: string;
  expected_contains: string[];
  generated_text: string;
  passed: boolean;
  completeness_score: number;
  latency_ms: number;
  error?: string | null;
}

export interface EvaluationResponse {
  id: string;
  timestamp: string;
  model_id: string;
  provider: string;
  dataset_name: string;
  total_prompts: number;
  passed_prompts: number;
  pass_rate: number;
  avg_completeness: number;
  avg_latency_ms: number;
  empty_or_malformed_count: number;
  details: EvaluationDetailItem[];
}

export interface HealthCheckResult {
  model_id: string;
  provider: string;
  status: string;
  latency_ms: number;
  message: string;
  timestamp: string;
}

export interface SystemReadyResponse {
  status: string;
  database_connected: boolean;
  local_ml_dependencies: boolean;
  compute_device: string;
  timestamp: string;
}
