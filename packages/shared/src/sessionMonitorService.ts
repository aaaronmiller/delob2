import { EventEmitter } from 'events';
import { watch } from 'fs';
import { ProxyLogService } from './proxyLogService.js';
import { SessionStore } from './sessionStore.js';
import { AlertGenerationService } from './alertGenerationService.js';
import type { SessionEvent, SessionEventType, ProxyLogEntry } from './types.js';

export class SessionMonitorService extends EventEmitter {
  private proxyLogService: ProxyLogService;
  private sessionStore: SessionStore;
  private alertService: AlertGenerationService;
  private watcher: ReturnType<typeof watch> | null = null;
  private isRunning = false;

  // Phase-aware stall thresholds (in seconds)
  private stallThresholds = {
    audit: 120,
    analysis: 90,
    recovery: 60,
    fix: 30,
    iterate: 90,
    default: 60
  };

  constructor(
    private proxyLogPath: string,
    private options: {
      contextWarningThreshold?: number;
      contextCriticalThreshold?: number;
    } = {}
  ) {
    super();
    this.proxyLogService = new ProxyLogService();
    this.sessionStore = new SessionStore();
    this.alertService = new AlertGenerationService({
      contextWarningThreshold: options.contextWarningThreshold ?? 0.85,
      contextCriticalThreshold: options.contextCriticalThreshold ?? 0.90
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('SessionMonitorService is already running');
    }

    this.isRunning = true;
    await this.tailProxyLog();
    this.startStallDetection();

    this.emit('started');
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isRunning = false;
    this.emit('stopped');
  }

  private async tailProxyLog(): Promise<void> {
    // Watch for changes in the proxy log file
    this.watcher = watch(this.proxyLogPath, async (eventType) => {
      if (eventType === 'change') {
        await this.processNewLogEntries();
      }
    });

    // Initial processing
    await this.processNewLogEntries();
  }

  private async processNewLogEntries(): Promise<void> {
    try {
      const entries = await this.proxyLogService.parseLogFile(this.proxyLogPath);

      for (const entry of entries) {
        await this.processLogEntry(entry);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async processLogEntry(entry: ProxyLogEntry): Promise<void> {
    // Update session state
    const sessionId = entry.requestId || 'default';
    this.sessionStore.updateActivity(sessionId, entry);

    // Check for alerts
    const alerts = this.alertService.checkForAlerts(entry, this.sessionStore.getSession(sessionId));

    for (const alert of alerts) {
      this.sessionStore.addAlert(sessionId, alert);
      this.emitEvent('alert_raised', sessionId, { alert });
    }

    // Emit events
    this.emitEvent('request_observed', sessionId, { entry });

    if (entry.statusCode) {
      this.emitEvent('response_observed', sessionId, { entry });
    }
  }

  private startStallDetection(): void {
    // Check for stalled sessions every 10 seconds
    setInterval(() => {
      this.checkForStalledSessions();
    }, 10000);
  }

  private checkForStalledSessions(): void {
    const sessions = this.sessionStore.getAllSessions();

    for (const session of sessions) {
      const idleTime = Date.now() - new Date(session.lastActivity).getTime();
      const phaseKey = (session.phase || 'default') as keyof typeof this.stallThresholds;
      const threshold = this.stallThresholds[phaseKey] * 1000;

      if (idleTime > threshold && session.status !== 'stalled') {
        this.sessionStore.updateSessionStatus(session.sessionId, 'stalled');

        const alert = this.alertService.createDeadlockAlert(
          session.sessionId,
          idleTime / 1000,
          session.tokenUsage.contextRatio
        );

        this.sessionStore.addAlert(session.sessionId, alert);
        this.emitEvent('deadlock_suspected', session.sessionId, {
          idleTime,
          threshold,
          contextRatio: session.tokenUsage.contextRatio
        });
      } else if (idleTime > threshold * 0.8 && session.status === 'active') {
        this.emitEvent('idle_warning', session.sessionId, { idleTime, threshold });
      }
    }
  }

  private emitEvent(type: SessionEventType, sessionId: string, data?: any): void {
    const event: SessionEvent = {
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      data
    };

    this.emit('session_event', event);
  }

  getSessionStore(): SessionStore {
    return this.sessionStore;
  }
}
