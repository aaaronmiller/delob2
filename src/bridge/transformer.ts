import { v4 as uuidv4 } from 'uuid';
import type { ProxyLogEntry } from './parser.js';

/**
 * Transformer
 *
 * Maps proxy fields to monitoring event schema.
 * Determines event type based on status codes and token usage.
 */

export type EventType =
  | 'tool_use'
  | 'stall_detected'
  | 'rate_limit'
  | 'context_saturation'
  | 'reasoning_overflow'
  | 'auth_failure'
  | 'model_refusal';

export interface MonitoringEvent {
  id: string;
  type: EventType;
  timestamp: string;
  session_id: string;
  project_id: string;
  context: any;
}

export class Transformer {
  private projectId: string;
  private contextWindow: number = 200000; // Default context window
  private reasoningBudget: number = 10000; // Default from settings

  constructor(projectId: string, config?: { contextWindow?: number; reasoningBudget?: number }) {
    this.projectId = projectId;
    if (config?.contextWindow) this.contextWindow = config.contextWindow;
    if (config?.reasoningBudget) this.reasoningBudget = config.reasoningBudget;
  }

  /**
   * Transform a proxy log entry into a monitoring event
   */
  transform(entry: ProxyLogEntry): MonitoringEvent {
    const eventType = this.determineEventType(entry);

    return {
      id: uuidv4(),
      type: eventType,
      timestamp: entry.timestamp,
      session_id: entry.session_id,
      project_id: this.projectId,
      context: this.buildContext(entry, eventType)
    };
  }

  /**
   * Determine event type based on proxy log entry
   */
  private determineEventType(entry: ProxyLogEntry): EventType {
    // Auth failure: 403
    if (entry.status === 403) {
      return 'auth_failure';
    }

    // Rate limit: 429
    if (entry.status === 429) {
      return 'rate_limit';
    }

    // Model refusal: 400
    if (entry.status === 400) {
      return 'model_refusal';
    }

    // Context saturation: (prompt_tokens + reasoning_tokens) / context_window > 0.85
    const totalTokens = entry.prompt_tokens + entry.reasoning_tokens;
    if (totalTokens / this.contextWindow > 0.85) {
      return 'context_saturation';
    }

    // Reasoning overflow: reasoning_tokens > reasoning_budget * 0.8
    if (entry.reasoning_tokens > this.reasoningBudget * 0.8) {
      return 'reasoning_overflow';
    }

    // Default: tool_use (successful API call)
    return 'tool_use';
  }

  /**
   * Build context object for the event
   */
  private buildContext(entry: ProxyLogEntry, eventType: EventType): any {
    const baseContext = {
      method: entry.method,
      status: entry.status,
      model: entry.model,
      tokens: {
        prompt: entry.prompt_tokens,
        completion: entry.completion_tokens,
        reasoning: entry.reasoning_tokens,
        total: entry.prompt_tokens + entry.completion_tokens + entry.reasoning_tokens
      },
      latency_ms: entry.latency_ms,
      cost: entry.cost
    };

    // Add event-specific context
    switch (eventType) {
      case 'context_saturation':
        return {
          ...baseContext,
          context_usage: (entry.prompt_tokens + entry.reasoning_tokens) / this.contextWindow,
          context_window: this.contextWindow
        };

      case 'reasoning_overflow':
        return {
          ...baseContext,
          reasoning_usage: entry.reasoning_tokens / this.reasoningBudget,
          reasoning_budget: this.reasoningBudget
        };

      case 'rate_limit':
        return {
          ...baseContext,
          message: 'Rate limit exceeded'
        };

      case 'auth_failure':
        return {
          ...baseContext,
          message: 'Authentication failed'
        };

      case 'model_refusal':
        return {
          ...baseContext,
          message: 'Model refused request'
        };

      default:
        return baseContext;
    }
  }
}
