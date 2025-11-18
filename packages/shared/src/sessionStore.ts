import type { SessionState, Alert, ProxyLogEntry, TokenUsage } from './types.js';

export class SessionStore {
  private sessions: Map<string, SessionState> = new Map();

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }

  updateActivity(sessionId: string, entry: ProxyLogEntry): void {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        status: 'active',
        lastActivity: entry.timestamp,
        tokenUsage: entry.tokenUsage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        alerts: []
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActivity = entry.timestamp;

      if (entry.tokenUsage) {
        // Accumulate token usage
        session.tokenUsage.promptTokens += entry.tokenUsage.promptTokens;
        session.tokenUsage.completionTokens += entry.tokenUsage.completionTokens;
        session.tokenUsage.totalTokens += entry.tokenUsage.totalTokens;

        if (entry.tokenUsage.contextRatio !== undefined) {
          session.tokenUsage.contextRatio = entry.tokenUsage.contextRatio;
        }
      }

      // Update status if it was stalled
      if (session.status === 'stalled' || session.status === 'idle') {
        session.status = 'active';
      }
    }
  }

  updateSessionStatus(sessionId: string, status: SessionState['status']): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
    }
  }

  setPhase(sessionId: string, phase: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.phase = phase;
    }
  }

  addAlert(sessionId: string, alert: Alert): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.alerts.push(alert);
    }
  }

  clearAlert(sessionId: string, alertId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const alert = session.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }
  }

  getActiveAlerts(sessionId: string): Alert[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.alerts.filter(a => !a.acknowledged);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  clearAll(): void {
    this.sessions.clear();
  }
}
