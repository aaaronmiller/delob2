# Delobotomize Monitoring System

**Inspired by**: [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena

This monitoring system provides real-time event collection and storage for Claude Code sessions.

## Architecture

- **Server**: Bun-based HTTP server with SQLite storage
- **Hooks**: Python scripts that send events from Claude Code to the server
- **Storage**: SQLite database with indexed queries

## Components

### Server (`server/index.ts`)

Simple HTTP server that:
- Receives events via POST /api/events
- Stores events in SQLite database
- Provides query endpoints for analysis
- Includes health check endpoint

### Hooks (`hooks/`)

Python scripts integrated with Claude Code:
- `session_start.py` - Session initialization events
- `post_tool_use.py` - Tool usage tracking

These hooks send JSON events to the monitoring server without blocking Claude Code operations.

## Usage

### Start Monitoring Server

```bash
# Via delobotomize-monitor command
delobotomize-monitor

# Or directly
bun run monitoring/server/index.ts
```

Server runs on http://localhost:4000

### Configure Claude Code Hooks

Copy hooks to your project's `.claude/hooks/` directory:

```bash
cp monitoring/hooks/*.py .claude/hooks/
```

Set environment variable:

```bash
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000
```

### Query Events

```bash
# Get all events
curl http://localhost:4000/api/events

# Filter by session
curl http://localhost:4000/api/events?session_id=abc-123

# Get statistics
curl http://localhost:4000/api/stats
```

## Event Format

Events follow this schema:

```typescript
{
  id: string;          // UUID
  type: EventType;     // Event classification
  timestamp: string;   // ISO 8601 with milliseconds
  session_id: string;  // Session identifier
  project_id: string;  // Project name
  context: object;     // Event-specific data
}
```

## Credit

This implementation was inspired by the excellent architecture of [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena. We studied their hook-based monitoring approach and implemented our own version.
