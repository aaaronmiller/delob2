# Delobotomize API Proxy

**Inspired by**: [claude-code-proxy](https://github.com/aaronmiller/claude-code-proxy) by Aaron Miller

A simple HTTP proxy that intercepts Anthropic API calls and logs them for analysis.

## Features

- **API Interception**: Proxies requests to Anthropic API
- **TSV Logging**: Writes detailed logs in tab-separated format
- **Token Tracking**: Counts prompt, completion, and reasoning tokens
- **Cost Calculation**: Estimates API costs based on token usage
- **Latency Measurement**: Tracks request/response times

## Usage

### Setup

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-api-key-here

# Optional configuration
export PROXY_PORT=8082
export PROXY_LOG_PATH=.delobotomize/proxy.log
```

### Start Proxy

```bash
python proxy/server.py
```

Server runs on http://127.0.0.1:8082

### Configure Claude Code

Point Claude Code to use the proxy:

```bash
export ANTHROPIC_API_BASE_URL=http://localhost:8082
claude-code
```

All API calls will now be logged to `proxy.log`.

## Log Format

Logs are written in TSV (tab-separated values) format:

```
timestamp | session_id | method | status | prompt_tokens | completion_tokens | reasoning_tokens | latency_ms | model | cost
```

Example:
```
2025-11-18T05:00:00.123Z	abc-123-def-456	POST /v1/messages	200	1850	450	2100	2341	claude-3-5-sonnet-20241022	0.0234
```

This format is designed to be easily parsed by the audit phase for analysis.

## Architecture

The proxy is intentionally simple (~300 lines) and focuses on:
- Transparent request forwarding
- Minimal overhead
- Reliable logging
- No data modification

## Credit

This implementation was inspired by the design principles of [claude-code-proxy](https://github.com/aaronmiller/claude-code-proxy) by Aaron Miller. We studied their proxy architecture and implemented our own simpler version focused on logging.
