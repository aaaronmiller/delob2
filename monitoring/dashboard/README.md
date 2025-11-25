# Delobotomize Monitoring Dashboard

A real-time web dashboard for monitoring Claude Code sessions, inspired by the visual design of [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena.

## Features

- **Real-time Event Monitoring** - Live updates every 5 seconds
- **Session Management** - Track multiple concurrent sessions
- **Event Timeline** - Chronological view of all events
- **Event Type Filtering** - Filter by tool_use, rate_limit, context_saturation, etc.
- **Visual Statistics** - Charts showing event distribution
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Comfortable for extended viewing

## Quick Start

### 1. Start Monitoring Server

```bash
# From project root
bun run monitoring/server/index.ts

# Or using delobotomize command
delobotomize-monitor
```

### 2. Open Dashboard

Navigate to http://localhost:4000 in your browser.

### 3. Configure Claude Code

Set up hooks to send events:

```bash
# Copy hooks to your project
cp -r claude-code/ .claude/

# Set environment variable
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000

# Start Claude Code
claude-code
```

## Dashboard Components

### Stats Grid
Top row showing:
- Total Events
- Active Sessions
- Projects Monitored
- Recent Events (last 5 minutes)

### Sessions Panel
Left side panel displaying:
- All active and recent sessions
- Session ID (truncated)
- Project name
- Event count per session
- Last activity time

Click a session to filter events to that session.

### Events Timeline
Right side panel showing:
- Chronological event list
- Color-coded event types
- Event context/details
- Timestamp

Filter by event type using the filter tags.

### Event Distribution Chart
Bottom panel showing:
- Bar chart of events by type
- Visual representation of event patterns

## Event Types

The dashboard tracks these event types:

- `session_start` - Session initialization (green)
- `tool_use` - Tool usage events (blue)
- `api_request` - API requests
- `api_response` - API responses
- `rate_limit` - Rate limit errors (red)
- `api_error` - API errors
- `context_saturation` - Context window near capacity (yellow)
- `reasoning_overflow` - Reasoning token budget exceeded

## Visual Design

The dashboard follows the multi-agent-workflow visual organization:
- Dark theme with high contrast
- Card-based layout
- Real-time updating stats
- Timeline-style event display
- Responsive grid system

### Color Scheme

```css
Primary: #6366f1 (Indigo)
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Danger: #ef4444 (Red)
Background: #0f172a (Dark Blue)
Cards: #1e293b (Slate)
```

## API Endpoints Used

The dashboard consumes these API endpoints:

- `GET /api/events?limit=1000` - Fetch recent events
- `GET /api/stats` - Get aggregated statistics

## Architecture

### Technology Stack

- **Frontend**: Vue 3 (CDN)
- **Charts**: Chart.js
- **Styling**: Vanilla CSS (no framework)
- **Real-time**: Polling every 5 seconds

### Data Flow

```
Claude Code Hooks
    ↓
HTTP POST /api/events
    ↓
SQLite Database
    ↓
HTTP GET /api/events
    ↓
Vue Dashboard
```

## Customization

### Change Refresh Rate

Edit the polling interval in `index.html`:

```javascript
this.refreshInterval = setInterval(() => {
  this.loadData();
}, 5000); // Change from 5000ms (5 seconds)
```

### Add Custom Event Types

Add new event type colors in the CSS:

```css
.event-dot.your_event_type { background: #custom-color; }
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Dashboard shows no events

1. Check monitoring server is running
2. Verify hooks are configured in `.claude/`
3. Check browser console for errors
4. Verify CORS is working (dashboard and API on same domain)

### Events not updating

1. Check browser console for fetch errors
2. Verify API endpoint: `curl http://localhost:4000/api/events`
3. Check server logs for errors

### Stats showing zero

1. Ensure events are being stored: check SQLite database
2. Verify stats endpoint: `curl http://localhost:4000/api/stats`
3. Check database permissions

## Credits

Visual design inspired by [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena.

## License

Part of the Delobotomize project.
