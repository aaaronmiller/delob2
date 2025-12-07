import { z } from 'zod';

/**
 * Parser
 *
 * Validates TSV format against defined schema.
 * Format: timestamp | session_id | method | status | prompt_tokens | completion_tokens | reasoning_tokens | latency_ms | model | cost
 */

const ProxyLogSchema = z.object({
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3,6}Z$/),
  session_id: z.string().uuid(),
  method: z.string(),
  status: z.number().int().min(100).max(599),
  prompt_tokens: z.number().int().min(0),
  completion_tokens: z.number().int().min(0),
  reasoning_tokens: z.number().int().min(0),
  latency_ms: z.number().int().min(0),
  model: z.string(),
  cost: z.number().min(0)
});

export type ProxyLogEntry = z.infer<typeof ProxyLogSchema>;

export class Parser {
  /**
   * Parse a TSV line from proxy.log
   */
  parse(line: string): ProxyLogEntry {
    const parts = line.split('\t').map(p => p.trim());

    if (parts.length !== 10) {
      throw new Error(`Invalid TSV format: expected 10 fields, got ${parts.length}`);
    }

    const entry = {
      timestamp: parts[0],
      session_id: parts[1],
      method: parts[2],
      status: parseInt(parts[3], 10),
      prompt_tokens: parseInt(parts[4], 10),
      completion_tokens: parseInt(parts[5], 10),
      reasoning_tokens: parseInt(parts[6], 10),
      latency_ms: parseInt(parts[7], 10),
      model: parts[8],
      cost: parseFloat(parts[9])
    };

    // Validate against schema
    return ProxyLogSchema.parse(entry);
  }

  /**
   * Validate a parsed entry
   */
  validate(entry: any): entry is ProxyLogEntry {
    try {
      ProxyLogSchema.parse(entry);
      return true;
    } catch {
      return false;
    }
  }
}
