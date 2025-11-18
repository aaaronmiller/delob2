export interface CliOptions {
  path?: string;
  phase?: string;
  resume?: string;
  budget?: number;
  stallTimeout?: number;
  enableKickApi?: boolean;
  trackTokensPerSession?: boolean;
  enableRecoveryEvents?: boolean;
  showBudgetInDashboard?: boolean;
  leaveServicesRunning?: boolean;
}

export interface RunManifest {
  runId: string;
  timestamp: string;
  phases: PhaseRecord[];
  confidenceSummary?: ConfidenceSummary;
  costs?: CostSummary;
  validationResults?: ValidationResult[];
  nextPhase?: string;
}

export interface PhaseRecord {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  artifacts?: string[];
  metrics?: Record<string, any>;
}

export interface ConfidenceSummary {
  high: number;
  medium: number;
  low: number;
}

export interface CostSummary {
  totalTokens: number;
  estimatedCost: number;
  provider: string;
}

export interface ValidationResult {
  check: string;
  passed: boolean;
  message?: string;
}
