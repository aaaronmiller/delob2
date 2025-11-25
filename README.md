# Delobotomize v15.0

**Claude Code recovery pipeline that rescues context-collapsed AI coding sessions**

## Overview

Delobotomize monitors Claude Code sessions via a vendored proxy, analyzes failures through natural language agents, and applies reversible fixes with human approval.

### Core Innovation
A single global monitoring server tracks unlimited target projects, providing real-time observability while maintaining project-local execution and artifacts.

## Features

- **5-Phase Pipeline**: Audit → Analysis → Recovery → Fix → Iterate
- **Real-time Monitoring**: Track sessions via proxy logs and hooks
- **Natural Language Configuration**: Markdown agents and skills, not YAML schemas
- **Reversible Fixes**: Atomic commits with explicit rollback procedures
- **Human-in-the-Loop**: Zero auto-approval, every change requires confirmation

## Installation

```bash
# Install globally
npm install -g delobotomize

# Initialize in your project
cd your-project
delobotomize init

# Start monitoring (optional)
delobotomize stack start
```

## Quick Start

```bash
# Run full 5-phase pipeline
delobotomize run

# Or run individual phases
delobotomize -audit
delobotomize -analysis
delobotomize -recovery
delobotomize -fix
delobotomize -iterate
```

## Architecture

Delobotomize vendors two complete MIT-licensed systems:

1. **Delobotomize Core** (active development): CLI orchestration, 5-phase pipeline
2. **Multi-Agent Workflow** (vendored, frozen): Monitoring server, Vue dashboard, Python hooks
3. **Claude Code Proxy** (vendored, frozen): Multi-provider API proxy, token tracking, logging

## Documentation

- [Product Requirements Document](prd-15.md) - Complete specification
- [CLAUDE.md](CLAUDE.md) - Development guide
- [NOTICE](NOTICE) - Legal attribution

## License

MIT License - see [LICENSE](LICENSE) file

Includes vendored software under MIT licenses (see [NOTICE](NOTICE) for details)

## Requirements

- Node.js >= 18.0.0
- Bun >= 1.0.0 (recommended)
- Claude Code CLI (installed separately)

## Project Status

Version 15.0 - Production-ready implementation of the complete recovery pipeline.
