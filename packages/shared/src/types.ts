export interface ProxyLogEntry {
  timestamp: string;
  requestId?: string;
  statusCode?: number;
  tokenUsage?: TokenUsage;
  latency?: number;
  headers?: Record<string, string>;
  error?: string;
  refusal?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextRatio?: number;
}

export interface SessionState {
  sessionId: string;
  status: 'active' | 'idle' | 'stalled' | 'completed';
  lastActivity: string;
  tokenUsage: TokenUsage;
  alerts: Alert[];
  phase?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
}

export type AlertType =
  | 'context_saturation'
  | 'rate_limit'
  | 'authentication'
  | 'deadlock'
  | 'refusal'
  | 'error';

export type SessionEventType =
  | 'session_started'
  | 'request_observed'
  | 'response_observed'
  | 'idle_warning'
  | 'deadlock_suspected'
  | 'alert_raised'
  | 'alert_cleared';

export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  timestamp: string;
  data?: any;
}

export interface RunManifest {
  runId: string;
  timestamp: string;
  projectPath: string;
  phases: PhaseRecord[];
  integrityCheck?: IntegrityCheckResult;
  alerts: Alert[];
  metrics: RunMetrics;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface PhaseRecord {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  duration?: number;
  artifacts: string[];
  metrics?: Record<string, any>;
}

export interface IntegrityCheckResult {
  success: boolean;
  timestamp: string;
  differences: string[];
  totalFiles: number;
}

export interface RunMetrics {
  totalTokens: number;
  estimatedCost?: number;
  totalAlerts: number;
  criticalAlerts: number;
  phases: number;
}

export interface RecoveryPlan {
  runId: string;
  tasks: RecoveryTask[];
  confidence: number;
  estimatedDuration?: string;
}

export interface RecoveryTask {
  id: string;
  description: string;
  confidence: number;
  dependencies: string[];
  reversible: boolean;
  steps: string[];
}
