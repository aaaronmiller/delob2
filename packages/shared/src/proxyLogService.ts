import { readFile } from 'fs/promises';
import type { ProxyLogEntry, TokenUsage } from './types.js';

export class ProxyLogService {
  private lastProcessedOffset = 0;

  async parseLogFile(logPath: string): Promise<ProxyLogEntry[]> {
    try {
      const content = await readFile(logPath, 'utf-8');
      const lines = content.split('\n').slice(this.lastProcessedOffset);

      this.lastProcessedOffset += lines.length;

      return lines
        .filter(line => line.trim().length > 0)
        .map(line => this.parseLogLine(line))
        .filter((entry): entry is ProxyLogEntry => entry !== null);
    } catch (error) {
      // File might not exist yet
      return [];
    }
  }

  private parseLogLine(line: string): ProxyLogEntry | null {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(line);

      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        requestId: parsed.request_id || parsed.requestId,
        statusCode: parsed.status_code || parsed.statusCode,
        tokenUsage: this.parseTokenUsage(parsed),
        latency: parsed.latency,
        headers: parsed.headers,
        error: parsed.error,
        refusal: parsed.refusal || this.detectRefusal(parsed)
      };
    } catch {
      // If not JSON, try to parse as structured text
      return this.parseTextLogLine(line);
    }
  }

  private parseTextLogLine(line: string): ProxyLogEntry | null {
    // Basic text log parsing
    // Format: [timestamp] [request_id] status=XXX tokens=YYY latency=ZZZ
    const timestampMatch = line.match(/\[([^\]]+)\]/);
    const statusMatch = line.match(/status=(\d+)/);
    const tokensMatch = line.match(/tokens=(\d+)/);
    const latencyMatch = line.match(/latency=(\d+)/);

    if (!timestampMatch) return null;

    return {
      timestamp: timestampMatch[1],
      statusCode: statusMatch ? parseInt(statusMatch[1]) : undefined,
      tokenUsage: tokensMatch ? {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: parseInt(tokensMatch[1])
      } : undefined,
      latency: latencyMatch ? parseInt(latencyMatch[1]) : undefined
    };
  }

  private parseTokenUsage(parsed: any): TokenUsage | undefined {
    if (!parsed.token_usage && !parsed.tokenUsage && !parsed.tokens) {
      return undefined;
    }

    const usage = parsed.token_usage || parsed.tokenUsage || parsed.tokens;

    return {
      promptTokens: usage.prompt_tokens || usage.promptTokens || 0,
      completionTokens: usage.completion_tokens || usage.completionTokens || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || usage.total || 0,
      contextRatio: usage.context_ratio || usage.contextRatio
    };
  }

  private detectRefusal(parsed: any): boolean {
    // Check for common refusal indicators
    const message = parsed.message || parsed.content || '';
    const refusalIndicators = [
      'I cannot',
      'I\'m not able to',
      'I apologize, but',
      'safety policy',
      'content policy'
    ];

    return refusalIndicators.some(indicator =>
      message.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  reset(): void {
    this.lastProcessedOffset = 0;
  }
}
