# Delobotomize Monitoring System

Complete guide to the Delobotomize monitoring and dashboard system.

## Overview

The Delobotomize monitoring system provides real-time visibility into Claude Code sessions, tracking events, tool usage, API calls, and potential issues like rate limits and context saturation.

**Inspired by**: [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena

## Architecture

```
┌─────────────────┐
│  Claude Code    │
│  with Hooks     │
└────────┬────────┘
         │ HTTP POST /api/events
         ▼
┌─────────────────┐      ┌──────────────┐
│ Monitoring      │─────▶│   SQLite     │
│ Server (Bun)    │      │   Database   │
└────────┬────────┘      └──────────────┘
         │ Serve /
         ▼
┌─────────────────┐
│ Web Dashboard   │
│ (Vue 3)         │
└─────────────────┘
```

## Quick Start

### 1. Start Monitoring Server

```bash
# Terminal 1: Start monitoring server
bun run monitoring/server/index.ts

# Server starts on http://localhost:4000
```

### 2. Configure Claude Code

```bash
# Copy hooks to your project
cp -r claude-code/ .claude/

# Set environment variable
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000

# Make hooks executable (if needed)
chmod +x .claude/hooks/*.py
```

### 3. Open Dashboard

Navigate to http://localhost:4000 in your browser.

### 4. Use Claude Code

```bash
# Run Claude Code normally
claude-code

# Events will automatically flow to the dashboard
```

## Components

### 1. Monitoring Server

**Location**: `monitoring/server/index.ts`

Bun-based HTTP server providing:
- Event ingestion endpoint (`POST /api/events`)
- Event query endpoint (`GET /api/events`)
- Statistics endpoint (`GET /api/stats`)
- Web dashboard serving (`GET /`)
- SQLite storage with indexes

### 2. Web Dashboard

**Location**: `monitoring/dashboard/index.html`

Single-page Vue 3 application featuring:
- **Real-time updates** - Polls every 5 seconds
- **Session list** - All sessions with event counts
- **Event timeline** - Chronological event display
- **Event filtering** - By type and session
- **Statistics** - Charts and aggregates
- **Dark theme** - Inspired by multi-agent-workflow

### 3. Python Hooks

**Location**: `claude-code/hooks/`

Four hooks for comprehensive monitoring:

#### session_start.py
Triggered when Claude Code session starts.
- Captures session initialization
- Records project context
- Sets session ID

#### post_tool_use.py
Triggered after each tool use.
- Tracks tool usage patterns
- Detects tool failures
- Monitors tool frequency

#### pre_request.py
Triggered before API requests.
- Tracks request patterns
- Helps predict rate limits
- Records model selection

#### post_response.py
Triggered after API responses.
- **Detects rate limits** (429 status)
- **Detects API errors** (4xx, 5xx)
- Tracks response status

## Event Types

| Type | Description | Color | Triggered By |
|------|-------------|-------|--------------|
| `session_start` | Session initialization | Green | session_start.py |
| `tool_use` | Tool execution | Blue | post_tool_use.py |
| `api_request` | API call initiated | Blue | pre_request.py |
| `api_response` | API call completed | Blue | post_response.py |
| `rate_limit` | Rate limit hit (429) | Red | post_response.py |
| `api_error` | API error (4xx/5xx) | Red | post_response.py |
| `context_saturation` | Context >85% full | Yellow | Proxy/Analysis |
| `reasoning_overflow` | Reasoning budget exceeded | Yellow | Proxy/Analysis |

## Dashboard Features

### Stats Grid
Four cards showing:
- **Total Events** - All events across all sessions
- **Active Sessions** - Unique session IDs
- **Projects** - Projects being monitored
- **Recent Events** - Last 5 minutes

### Sessions Panel
- Click to filter events by session
- Shows session ID, project name, event count
- Sorted by most recent activity
- Active session highlighted

### Events Timeline
- Chronological event list
- Color-coded by type
- Expandable context details
- Filter by event type

### Event Distribution Chart
- Bar chart of events by type
- Visual pattern recognition
- Auto-updates with new data

## Configuration

### Environment Variables

```bash
# Monitoring server URL (for hooks)
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000

# Session ID (auto-generated if not set)
export CLAUDE_SESSION_ID=$(uuidgen)

# Server port (for monitoring server)
export PORT=4000

# Database path (for monitoring server)
export DB_PATH=.delobotomize/monitoring.db
```

### Settings Template

Copy `claude-code/settings-template.json` to `.claude/settings.json`:

```json
{
  "hooks": {
    "session_start": ".claude/hooks/session_start.py",
    "post_tool_use": ".claude/hooks/post_tool_use.py",
    "pre_request": ".claude/hooks/pre_request.py",
    "post_response": ".claude/hooks/post_response.py"
  },
  "delobotomize": {
    "enabled": true,
    "monitoring_server_url": "http://localhost:4000"
  }
}
```

## Testing

### Automated Test

```bash
# Run comprehensive test suite
./scripts/test-monitoring.sh
```

This will:
1. Check server health
2. Send test events
3. Query events via API
4. Verify statistics
5. Report results

### Manual Testing

```bash
# Terminal 1: Start server
bun run monitoring/server/index.ts

# Terminal 2: Send test event
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "type": "tool_use",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
    "session_id": "test-session",
    "project_id": "test-project",
    "context": {"test": true}
  }'

# Terminal 3: Query events
curl http://localhost:4000/api/events | jq
```

## API Reference

### POST /api/events

Store an event.

**Request Body**:
```json
{
  "id": "uuid",
  "type": "event_type",
  "timestamp": "2025-11-18T12:00:00.000Z",
  "session_id": "session-uuid",
  "project_id": "project-name",
  "context": {}
}
```

**Response**:
```json
{
  "success": true,
  "id": "uuid"
}
```

### GET /api/events

Query events.

**Query Parameters**:
- `session_id` - Filter by session
- `project_id` - Filter by project
- `limit` - Max results (default: 100)

**Response**:
```json
{
  "events": [...],
  "count": 42
}
```

### GET /api/stats

Get statistics.

**Response**:
```json
{
  "stats": [
    {
      "total_events": 100,
      "total_sessions": 5,
      "total_projects": 3,
      "type": "tool_use",
      "count": 50
    }
  ]
}
```

## Troubleshooting

### Dashboard shows "No sessions yet"

**Problem**: No events are being received.

**Solutions**:
1. Check monitoring server is running
2. Verify hooks are configured in `.claude/settings.json`
3. Check `DELOBOTOMIZE_SERVER_URL` environment variable
4. Ensure hooks are executable: `chmod +x .claude/hooks/*.py`
5. Check server logs for errors

### "Failed to fetch" error in browser console

**Problem**: Dashboard can't connect to API.

**Solutions**:
1. Verify server is running on correct port
2. Check browser URL matches server URL
3. Look for CORS errors in console
4. Ensure no firewall blocking port 4000

### Events not updating in real-time

**Problem**: Dashboard not polling.

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify polling interval is set (5 seconds)
3. Check network tab for failed requests
4. Hard refresh browser (Ctrl+F5)

### Hooks not firing

**Problem**: Claude Code not executing hooks.

**Solutions**:
1. Verify `.claude/settings.json` exists
2. Check hook paths are correct
3. Ensure hooks are executable
4. Check Claude Code version supports hooks
5. Look for hook errors in stderr

## Performance

### Database Size

SQLite database grows with events. Approximate sizes:
- 1000 events ≈ 500KB
- 10000 events ≈ 5MB
- 100000 events ≈ 50MB

### Cleanup

To clear old events:

```bash
# Delete database
rm .delobotomize/monitoring.db

# Or query and delete specific sessions
sqlite3 .delobotomize/monitoring.db "DELETE FROM events WHERE session_id = 'old-session-id'"
```

### Scaling

For high-volume usage:
1. Increase polling interval in dashboard
2. Limit event retention in database
3. Use `limit` parameter in queries
4. Consider pagination for large result sets

## Integration with Delobotomize Pipeline

The monitoring system integrates with the 5-phase pipeline:

1. **Audit Phase** - Reads events from database
2. **Analysis Phase** - Analyzes event patterns
3. **Recovery Phase** - Uses events to identify issues
4. **Fix Phase** - References events for context
5. **Iterate Phase** - Monitors fix effectiveness

## Credits

Visual design and architecture inspired by [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena.

## License

Part of the Delobotomize project. See LICENSE file.
