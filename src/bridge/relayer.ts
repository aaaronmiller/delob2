import type { MonitoringEvent } from './transformer.js';

/**
 * Relayer
 *
 * POSTs transformed events to monitoring server.
 * Implements retry logic with exponential backoff.
 */

export class Relayer {
  private serverUrl: string;
  private maxRetries: number = 3;
  private baseDelay: number = 100; // ms

  constructor(serverUrl: string = 'http://localhost:4000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Send event to monitoring server
   */
  async send(event: MonitoringEvent): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.serverUrl}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success
        return;

      } catch (error) {
        lastError = error as Error;

        // If not last attempt, wait and retry
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.error('Failed to send event after retries:', lastError);
    // Don't throw - continue processing (never block)
  }

  /**
   * Send multiple events in batch
   */
  async sendBatch(events: MonitoringEvent[]): Promise<void> {
    // Send events concurrently (up to 10 at a time to avoid overwhelming server)
    const batchSize = 10;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Promise.all(batch.map(event => this.send(event)));
    }
  }

  /**
   * Check if monitoring server is available
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/healthz`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
