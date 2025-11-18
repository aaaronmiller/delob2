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

## Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Quick Start

### 1. Initialize Delobotomize

```bash
# Initialize in your project
delobotomize init

# This will:
# - Mirror claude docs/ to .claude/
# - Create .delobotomize/ structure
# - Verify integrity
```

### 2. Run Monitoring

```bash
# Start integrated monitoring and run phases
delobotomize run

# Run specific phases
delobotomize audit
delobotomize analysis
delobotomize recovery
delobotomize fix
```

### 3. Launch Dashboard

```bash
# Start backend API
pnpm dev:backend

# Start frontend dashboard
pnpm dev:frontend
```

Visit http://localhost:5173 to view the dashboard.

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
