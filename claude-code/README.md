# Delobotomize Claude Code Configuration

This directory contains Claude Code configuration files and hooks for the Delobotomize monitoring system.

## Quick Start

### 1. Copy Configuration to Your Project

```bash
# From within your project
cp -r path/to/delobotomize/claude-code/ .claude/

# Or use delobotomize init
delobotomize init
```

### 2. Configure Settings

Edit `.claude/settings.json`:

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

### 3. Start Monitoring Server

```bash
# Terminal 1: Start monitoring server
delobotomize-monitor

# Or directly with Bun
bun run monitoring/server/index.ts
```

### 4. (Optional) Start Proxy

```bash
# Terminal 2: Start proxy server
python proxy/server.py

# Then configure Claude Code to use proxy
export ANTHROPIC_API_BASE_URL=http://localhost:8082
```

### 5. Use Claude Code Normally

```bash
# Your hooks will automatically send events to the monitoring server
claude-code
```

### 6. View Dashboard

Open http://localhost:4000 in your browser to see real-time monitoring.

## Hooks

### session_start.py
Triggered when a Claude Code session starts.
- Sends session initialization event
- Tracks project info and session ID

### post_tool_use.py
Triggered after each tool use.
- Tracks which tools are being used
- Detects tool failures
- Monitors tool usage patterns

### pre_request.py
Triggered before API requests.
- Tracks request patterns
- Helps detect rate limit issues

### post_response.py
Triggered after API responses.
- Detects rate limits (429)
- Detects API errors (4xx, 5xx)
- Tracks response status

## Environment Variables

Set these in your shell or `.env`:

```bash
# Monitoring server URL
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000

# Proxy server URL (if using proxy)
export ANTHROPIC_API_BASE_URL=http://localhost:8082

# Your Anthropic API key
export ANTHROPIC_API_KEY=your-key-here

# Session ID (auto-generated if not set)
export CLAUDE_SESSION_ID=$(uuidgen)
```

## File Structure

```
.claude/
├── hooks/                   # Hook scripts
│   ├── session_start.py
│   ├── post_tool_use.py
│   ├── pre_request.py
│   └── post_response.py
├── settings.json           # Claude Code settings
└── README.md              # This file
```

## Troubleshooting

### Hooks not firing?
- Ensure hooks are executable: `chmod +x .claude/hooks/*.py`
- Check Claude Code version supports hooks
- Verify paths in settings.json

### Can't connect to monitoring server?
- Ensure server is running: `delobotomize-monitor`
- Check DELOBOTOMIZE_SERVER_URL environment variable
- Verify port 4000 is available

### No events in dashboard?
- Check browser console for errors
- Verify API endpoints: `curl http://localhost:4000/api/events`
- Check server logs

## Credits

Hook architecture inspired by [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena.
