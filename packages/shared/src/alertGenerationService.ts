import type { Alert, AlertType, ProxyLogEntry, SessionState } from './types.js';
import { randomBytes } from 'crypto';

export class AlertGenerationService {
  private contextWarningThreshold: number;
  private contextCriticalThreshold: number;
  private recentAlerts: Map<string, number> = new Map();
  private suppressionWindow = 60000; // 60 seconds

  constructor(options: {
    contextWarningThreshold?: number;
    contextCriticalThreshold?: number;
  } = {}) {
    this.contextWarningThreshold = options.contextWarningThreshold ?? 0.85;
    this.contextCriticalThreshold = options.contextCriticalThreshold ?? 0.90;
  }

  checkForAlerts(entry: ProxyLogEntry, session?: SessionState): Alert[] {
    const alerts: Alert[] = [];

    // Check for rate limiting
    if (entry.statusCode === 429) {
      const alert = this.createAlert(
        'rate_limit',
        'high',
        'Rate limit exceeded',
        { requestId: entry.requestId, headers: entry.headers }
      );
      if (this.shouldEmitAlert(alert)) {
        alerts.push(alert);
      }
    }

    // Check for authentication failures
    if (entry.statusCode === 403) {
      const alert = this.createAlert(
        'authentication',
        'high',
        'Authentication or authorization failure',
        { requestId: entry.requestId, statusCode: entry.statusCode }
      );
      if (this.shouldEmitAlert(alert)) {
        alerts.push(alert);
      }
    }

    // Check for refusals
    if (entry.refusal) {
      const alert = this.createAlert(
        'refusal',
        'medium',
        'Model refusal detected',
        { requestId: entry.requestId }
      );
      if (this.shouldEmitAlert(alert)) {
        alerts.push(alert);
      }
    }

    // Check for context saturation
    if (entry.tokenUsage?.contextRatio !== undefined) {
      const ratio = entry.tokenUsage.contextRatio;

      if (ratio >= this.contextCriticalThreshold) {
        const alert = this.createAlert(
          'context_saturation',
          'critical',
          `Context window at ${(ratio * 100).toFixed(1)}% (critical threshold)`,
          { contextRatio: ratio, tokenUsage: entry.tokenUsage }
        );
        if (this.shouldEmitAlert(alert)) {
          alerts.push(alert);
        }
      } else if (ratio >= this.contextWarningThreshold) {
        const alert = this.createAlert(
          'context_saturation',
          'medium',
          `Context window at ${(ratio * 100).toFixed(1)}% (warning threshold)`,
          { contextRatio: ratio, tokenUsage: entry.tokenUsage }
        );
        if (this.shouldEmitAlert(alert)) {
          alerts.push(alert);
        }
      }
    }

    // Check for errors
    if (entry.error) {
      const alert = this.createAlert(
        'error',
        'high',
        entry.error,
        { requestId: entry.requestId, statusCode: entry.statusCode }
      );
      if (this.shouldEmitAlert(alert)) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  createDeadlockAlert(sessionId: string, idleTime: number, contextRatio?: number): Alert {
    const isContextStall = contextRatio !== undefined && contextRatio >= 0.90;

    return this.createAlert(
      'deadlock',
      'critical',
      isContextStall
        ? `Session stalled (context saturation: ${(contextRatio * 100).toFixed(1)}%)`
        : `Session stalled (idle for ${idleTime.toFixed(0)}s)`,
      {
        sessionId,
        idleTime,
        contextRatio,
        classification: isContextStall ? 'context_stall' : 'logic_stall'
      }
    );
  }

  private createAlert(
    type: AlertType,
    severity: Alert['severity'],
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    return {
      id: this.generateAlertId(),
      type,
      severity,
      timestamp: new Date().toISOString(),
      message,
      metadata,
      acknowledged: false
    };
  }

  private shouldEmitAlert(alert: Alert): boolean {
    const key = `${alert.type}:${alert.severity}`;
    const lastEmitted = this.recentAlerts.get(key);

    if (lastEmitted && Date.now() - lastEmitted < this.suppressionWindow) {
      return false; // Suppress duplicate alert
    }

    this.recentAlerts.set(key, Date.now());
    return true;
  }

  private generateAlertId(): string {
    return randomBytes(8).toString('hex');
  }
}
