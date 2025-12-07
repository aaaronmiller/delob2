import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Parser } from '../src/bridge/parser';
import { Transformer } from '../src/bridge/transformer';
import { Relayer } from '../src/bridge/relayer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Delobotomize Test Suite
 * 
 * Tests for core components:
 * - Bridge components (Parser, Transformer, Relayer)
 * - Configuration loading
 * - Artifact management
 */

describe('Parser', () => {
    const parser = new Parser();

    it('should parse valid TSV line', () => {
        const line = '2025-01-15T10:00:00.123456Z\t550e8400-e29b-41d4-a716-446655440000\tPOST /v1/messages\t200\t1000\t500\t100\t1500\tclaude-3-5-sonnet-20241022\t0.0450';

        const result = parser.parse(line);

        expect(result.timestamp).toBe('2025-01-15T10:00:00.123456Z');
        expect(result.session_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.method).toBe('POST /v1/messages');
        expect(result.status).toBe(200);
        expect(result.prompt_tokens).toBe(1000);
        expect(result.completion_tokens).toBe(500);
        expect(result.reasoning_tokens).toBe(100);
        expect(result.latency_ms).toBe(1500);
        expect(result.model).toBe('claude-3-5-sonnet-20241022');
        expect(result.cost).toBe(0.045);
    });

    it('should reject invalid TSV format', () => {
        const line = 'invalid\tformat\twith\tfew\tfields';

        expect(() => parser.parse(line)).toThrow('expected 10 fields');
    });

    it('should validate parsed entries', () => {
        const validEntry = {
            timestamp: '2025-01-15T10:00:00.123Z',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            method: 'POST',
            status: 200,
            prompt_tokens: 100,
            completion_tokens: 50,
            reasoning_tokens: 0,
            latency_ms: 500,
            model: 'claude-3-5-sonnet',
            cost: 0.01
        };

        expect(parser.validate(validEntry)).toBe(true);
    });
});

describe('Transformer', () => {
    const transformer = new Transformer('test-project');

    it('should transform entry to monitoring event', () => {
        const entry = {
            timestamp: '2025-01-15T10:00:00.123456Z',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            method: 'POST /v1/messages',
            status: 200,
            prompt_tokens: 1000,
            completion_tokens: 500,
            reasoning_tokens: 100,
            latency_ms: 1500,
            model: 'claude-3-5-sonnet-20241022',
            cost: 0.045
        };

        const event = transformer.transform(entry);

        expect(event.id).toBeDefined();
        expect(event.type).toBe('tool_use');
        expect(event.session_id).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(event.project_id).toBe('test-project');
        expect(event.context.tokens.total).toBe(1600);
    });

    it('should detect rate limit events', () => {
        const entry = {
            timestamp: '2025-01-15T10:00:00.123456Z',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            method: 'POST',
            status: 429,
            prompt_tokens: 0,
            completion_tokens: 0,
            reasoning_tokens: 0,
            latency_ms: 100,
            model: 'claude-3-5-sonnet',
            cost: 0
        };

        const event = transformer.transform(entry);

        expect(event.type).toBe('rate_limit');
    });

    it('should detect auth failure events', () => {
        const entry = {
            timestamp: '2025-01-15T10:00:00.123456Z',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            method: 'POST',
            status: 403,
            prompt_tokens: 0,
            completion_tokens: 0,
            reasoning_tokens: 0,
            latency_ms: 50,
            model: 'claude-3-5-sonnet',
            cost: 0
        };

        const event = transformer.transform(entry);

        expect(event.type).toBe('auth_failure');
    });

    it('should detect context saturation', () => {
        const highContextTransformer = new Transformer('test', { contextWindow: 200000 });

        const entry = {
            timestamp: '2025-01-15T10:00:00.123456Z',
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            method: 'POST',
            status: 200,
            prompt_tokens: 180000,  // 90% of 200k
            completion_tokens: 1000,
            reasoning_tokens: 0,
            latency_ms: 5000,
            model: 'claude-3-5-sonnet',
            cost: 1.0
        };

        const event = highContextTransformer.transform(entry);

        expect(event.type).toBe('context_saturation');
    });
});

describe('Relayer', () => {
    const relayer = new Relayer('http://localhost:9999');

    it('should handle connection failures gracefully', async () => {
        const event = {
            id: 'test-id',
            type: 'tool_use' as const,
            timestamp: new Date().toISOString(),
            session_id: '550e8400-e29b-41d4-a716-446655440000',
            project_id: 'test',
            context: {}
        };

        // Should not throw even when server is unavailable
        await relayer.send(event);
    });

    it('should ping return false when server unavailable', async () => {
        const result = await relayer.ping();
        expect(result).toBe(false);
    });
});

describe('Integration', () => {
    const testDir = '/tmp/delobotomize-test';

    beforeEach(async () => {
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true });
        } catch { }
    });

    it('should process TSV line through full pipeline', async () => {
        const parser = new Parser();
        const transformer = new Transformer('integration-test');

        const tsvLine = '2025-01-15T10:00:00.123456Z\t550e8400-e29b-41d4-a716-446655440000\tPOST /v1/messages\t200\t1000\t500\t100\t1500\tclaude-3-5-sonnet-20241022\t0.0450';

        const parsed = parser.parse(tsvLine);
        const event = transformer.transform(parsed);

        expect(event.type).toBe('tool_use');
        expect(event.project_id).toBe('integration-test');
        expect(event.context.cost).toBe(0.045);
    });
});
