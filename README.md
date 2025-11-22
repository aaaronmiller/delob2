# Delobotomize

> **Claude Code Monitoring and Recovery Toolchain**

Delobotomize is a comprehensive session-level monitoring and recovery system for Claude Code, designed to detect stalls, manage context saturation, and orchestrate automated recovery workflows.

## Features

- **Session-Level Monitoring** - Track Claude Code sessions via proxy log analysis
- **Five-Phase Recovery Pipeline** - Audit → Analysis → Recovery → Fix → Iterate
- **Real-Time Dashboard** - Live session metrics, alerts, and run visualization
- **Automated Artifact Generation** - Complete audit trails and manifests
- **Integrity Enforcement** - Strict synchronization between `claude docs/` and `.claude/`
- **No Auto-Kill Policy** - Sessions are never automatically terminated
- **Auto-Deploy Services** - Backend and frontend start automatically (optional)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Output & Artifacts](#output--artifacts)
- [CLI Commands Reference](#cli-commands-reference)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Development](#development)

## Installation

### Option A: Global Install (Recommended)

```bash
cd /path/to/delob2
pnpm install
pnpm build
cd packages/cli
npm link
```

After this, `delobotomize` is available system-wide.

### Option B: Run from Repository

```bash
cd /path/to/delob2
pnpm install
pnpm build
```

Then use: `node packages/cli/dist/index.js <command>` or `cd packages/cli && pnpm dev -- <command>`

**Note**: `npm link` creates a local symlink - no publishing or `npm install -g` needed.

## Quick Start

### First Time Setup

```bash
# Initialize a project
cd ~/my-project
delobotomize init
```

### Start Monitoring

```bash
# Run with auto-started backend + dashboard
delobotomize ~/my-project

# Or run without services
delobotomize ~/my-project --no-frontend --no-backend
```

### Access Dashboard

Open browser: http://localhost:5173

### Run Recovery Phases

```bash
# In another terminal
delobotomize audit
delobotomize analysis
delobotomize recovery
delobotomize fix
```

### Stop Monitoring

Press `Ctrl+C` in the monitoring terminal.

## Usage Examples

### Complete Monitoring Session

```bash
# Initialize
delobotomize init --path ~/my-project

# Start monitoring
delobotomize ~/my-project
```

### Run Specific Phase

```bash
delobotomize run --path ~/my-project --phase audit
```

### Disable Services

```bash
# No dashboard
delobotomize ~/my-project --no-frontend

# No backend
delobotomize ~/my-project --no-backend

# Both disabled
delobotomize ~/my-project --no-frontend --no-backend
```

### Check Status & History

```bash
# Current status
delobotomize status

# List all runs
delobotomize list-runs

# Check system health
delobotomize check
```

### Recovery Workflow

```bash
# Run all phases
delobotomize audit
delobotomize analysis
delobotomize recovery
delobotomize fix

# Rollback if needed
delobotomize rollback

# Clean artifacts
delobotomize clean
```

## Output & Artifacts

### File Structure

Delobotomize creates and manages files in the target project directory:

```
your-project/
├── .delobotomize/
│   ├── proxy.log              # Proxy activity log (source of truth)
│   ├── claude-docs-integrity.json  # Integrity check results
│   ├── runs/
│   │   └── run_<timestamp>_<id>/
│   │       ├── manifest.json       # Run metadata and phase records
│   │       ├── MANIFEST.md         # Human-readable summary
│   │       └── artifacts/
│   │           ├── audit/
│   │           │   ├── AUDIT_REPORT.md
│   │           │   ├── file-inventory.json
│   │           │   └── settings-validation.json
│   │           ├── analysis/
│   │           │   ├── ANALYSIS_REPORT.md
│   │           │   └── CAUSAL_CHAIN.md
│   │           ├── recovery/
│   │           │   ├── RECOVERY_PLAN.md
│   │           │   └── execution-order.json
│   │           ├── fix/
│   │           │   ├── FIX_REPORT.md
│   │           │   ├── changes.patch
│   │           │   └── test-results.json
│   │           └── iterate/
│   │               └── ITERATE_NOTES.md
│   └── checkpoints/          # Git checkpoints before fixes
├── .claude/                  # Runtime mirror (auto-generated)
└── claude docs/              # Canonical configuration source
```

## User Story: Typical Session

Here's what a typical Delobotomize session looks like:

### Scenario: Monitoring a Claude Code Project

```bash
# 1. You have a project you want to monitor
$ cd ~/my-claude-project

# 2. Initialize Delobotomize (first time only)
$ delobotomize init
✔ Creating .claude directory structure...
✔ Mirroring claude docs/ to .claude/...
✔ Creating .delobotomize directory structure...
✔ Verifying claude docs integrity...
✔ Delobotomize initialized successfully
  .claude/ directory created
  .delobotomize/ directory created
  Integrity report: .delobotomize/claude-docs-integrity.json

# 3. Start monitoring (auto-starts backend + dashboard)
$ delobotomize ~/my-claude-project
✔ Verifying claude docs integrity...
✔ Backend started on port 4000
✔ Frontend started on port 5173
✔ Monitoring active

Delobotomize is running

  Backend API:  http://localhost:4000
  Dashboard:    http://localhost:5173
  Project path: /Users/you/my-claude-project
  Proxy log:    /Users/you/my-claude-project/.delobotomize/proxy.log

Press Ctrl+C to stop

# 4. Open browser and visit http://localhost:5173
# You see the dashboard with:
# - Live session list (currently active Claude Code sessions)
# - Token utilization bar (showing context usage)
# - Alerts tray (any rate limits, refusals, or stalls)
# - Recent runs (history of audit/analysis/recovery cycles)

# 5. Claude Code session experiences a stall
# Dashboard shows:
#   🔴 CRITICAL ALERT: Session stalled (idle for 125s)
#   Context: 92.3% (critical threshold)

# 6. Run recovery phases (in another terminal)
$ delobotomize audit
✔ Reading proxy logs...
✔ Analyzing session incidents...
✔ Generating audit report...
✔ Audit completed

$ delobotomize analysis
✔ Loading audit findings...
✔ Building causal chains...
✔ Generating analysis report...
✔ Analysis completed

$ delobotomize recovery
✔ Loading analysis results...
✔ Generating recovery plan...
✔ Validating plan steps...
✔ Recovery plan generated

# 7. Review the generated artifacts
$ cat .delobotomize/runs/run_1234567890_abc123/artifacts/audit/AUDIT_REPORT.md
# Shows: 5 context saturation events, 2 rate limits, 1 suspected deadlock

$ cat .delobotomize/runs/run_1234567890_abc123/artifacts/recovery/RECOVERY_PLAN.md
# Shows: Proposed fixes with confidence scores

# 8. Apply fixes (creates git checkpoint first)
$ delobotomize fix
✔ Creating git checkpoint...
✔ Applying fixes...
✔ Running tests...
✔ Generating change log...
✔ Fixes applied successfully

# 9. Stop monitoring
$ # Go back to the first terminal
$ # Press Ctrl+C
⚠ Received interrupt signal
✔ Stopping services...

# 10. Check run history anytime
$ delobotomize list-runs
Recent runs:
  run_1234567890_abc123 (completed) - 2024-01-15 10:30:00
  run_1234567891_def456 (completed) - 2024-01-15 09:15:00

$ delobotomize status
Delobotomize Status:
  Current phase: None
  Active alerts: 0
  Artifacts: .delobotomize/runs/
```

## Architecture

### Technology Stack

- **CLI**: Node.js + Commander + TypeScript
- **Backend**: Hono (Bun runtime)
- **Frontend**: SvelteKit + Tailwind CSS
- **Shared Services**: TypeScript libraries for monitoring, analysis, and recovery
- **Package Manager**: pnpm workspace

### Project Structure

```
delobotomize/
├── packages/
│   ├── cli/              # CLI commands (init, run, audit, etc.)
│   ├── shared/           # Core services and business logic
│   ├── backend/          # Hono API server
│   └── frontend/         # SvelteKit dashboard
├── claude docs/          # Canonical source for Claude assets
├── .claude/              # Runtime mirror (generated)
├── .delobotomize/        # Run artifacts and logs
│   ├── runs/             # Run-specific artifacts
│   ├── checkpoints/      # Git checkpoints
│   └── proxy.log         # Proxy log (source of truth)
└── prd.md                # Product Requirements Document
```

## CLI Commands

### Core Commands

- `delobotomize init` - Initialize project structure
- `delobotomize run` - Execute integrated monitoring and phases
- `delobotomize status` - Show current status and alerts
- `delobotomize list-runs` - List all historical runs

### Phase Commands

- `delobotomize audit` - Audit session activity and create findings
- `delobotomize analysis` - Analyze findings and build causal chains
- `delobotomize recovery` - Generate recovery plan
- `delobotomize fix` - Apply fixes with git checkpointing
- `delobotomize iterate` - Record notes and emit summary (v1 stub)

### Utility Commands

- `delobotomize check` - Verify system health
- `delobotomize rollback` - Restore pre-fix checkpoint
- `delobotomize clean` - Remove transient artifacts

## Configuration

Configuration is managed through `claude docs/settings.json`:

```json
{
  "delobotomize": {
    "monitoring": {
      "proxyLogPath": "./.delobotomize/proxy.log",
      "contextWarningThreshold": 0.85,
      "contextCriticalThreshold": 0.90
    },
    "stallThresholds": {
      "audit": 120,
      "analysis": 90,
      "recovery": 60,
      "fix": 30,
      "iterate": 90
    }
  }
}
```

## Monitoring

### Alert Types

- **Context Saturation** - Warning at 85%, critical at 90%
- **Rate Limiting** - 429 responses with rate limit headers
- **Authentication** - 403 errors
- **Deadlock** - No activity within phase-specific threshold
- **Refusal** - Model refusal patterns detected

### Phase-Aware Stall Detection

Different phases have different idle thresholds:

- Audit: 120s
- Analysis: 90s
- Recovery: 60s
- Fix: 30s
- Iterate: 90s

## Recovery Pipeline

### Phase 1: Audit

Enumerate files, validate configuration, analyze session incidents.

**Outputs**: `AUDIT_REPORT.md`, `file-inventory.json`, `claude-docs-integrity.json`

### Phase 2: Analysis

Build causal chains, reconstruct intent, score priorities.

**Outputs**: `ANALYSIS_REPORT.md`, `CAUSAL_CHAIN.md`, `fix-tasks.json`

### Phase 3: Recovery

Generate executable plans with dependency ordering.

**Outputs**: `RECOVERY_SUMMARY.md`, `plan-*.md`, `execution-order.json`

### Phase 4: Fix

Apply changes with git checkpointing and testing.

**Outputs**: `FIX_REPORT.md`, `changes.patch`, `test-results.json`

### Phase 5: Iterate (v1 Stub)

Record observations for future improvements.

**Outputs**: `ITERATE_NOTES.md`, `feedback-summary.json`

## Integrity Enforcement

Delobotomize enforces strict integrity between `claude docs/` and `.claude/`:

1. `claude docs/` is the **canonical source** - never modify `.claude/` directly
2. Run `delobotomize init` to sync changes
3. Integrity checks run before every phase
4. Drift causes blocking failures with remediation instructions

## Dashboard

The SvelteKit dashboard provides:

- **Live Sessions Panel** - Active sessions with status and metrics
- **Token Utilization Widgets** - Visual context ratio bars with thresholds
- **Alerts Tray** - Filterable real-time alerts
- **Runs View** - Historical run manifests and phase details

## Development

```bash
# Install dependencies
pnpm install

# Run CLI in dev mode
pnpm dev:cli

# Run backend in dev mode
pnpm dev:backend

# Run frontend in dev mode
pnpm dev:frontend

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format
```

## Hard Constraints

- **No Docker** - Local development only
- **Session-Level Monitoring** - No subagent instrumentation
- **Proxy Log as Source of Truth** - `.delobotomize/proxy.log` is authoritative
- **No Auto-Kill** - Sessions never automatically terminated
- **Natural Language Config** - All policies defined in markdown

## Contributing

This project follows the PRD v9.1 specification. All changes must:

1. Preserve hard constraints
2. Maintain session-level monitoring only
3. Keep proxy as source of truth
4. Respect natural language configuration
5. Never introduce Docker dependencies

## License

See LICENSE file for details.

## Related Projects

- **claude-code-proxy** - Crosstalk proxy for Claude Code API traffic
- **multi-agent-workflow** - Hook scripts and observability dashboard

## Support

For issues and questions, refer to the PRD documentation in `prd.md`.
