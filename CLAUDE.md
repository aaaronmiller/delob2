# Delobotomize Development Guide

This guide is for developers working on Delobotomize Core.

## Architecture Overview

### Three-System Architecture

1. **Delobotomize Core** (src/) - Active development
   - CLI orchestration
   - 5-phase pipeline implementation
   - Hook bridge (log-reader, parser, transformer, relayer)
   - Configuration management
   - Integrity checking

2. **Multi-Agent Workflow** (integrations/multi-agent-workflow/) - Frozen
   - Monitoring server (Bun)
   - Vue dashboard
   - Python hooks
   - NEVER modify - use as black box

3. **Claude Code Proxy** (integrations/claude-code-proxy/) - Frozen
   - Multi-provider API proxy
   - Token tracking and logging
   - NEVER modify (except file_logger.py patch)

### Development Focus

**90% of effort should be on Delobotomize Core (src/).**

The vendored systems are frozen black boxes. Only the hook bridge connects them.

## Project Structure

```
src/
├── cli.ts              # Commander-based CLI entry point
├── init.ts             # Project initialization
├── config.ts           # Configuration management
├── integrity.ts        # .claude/ integrity checking
├── artifacts.ts        # Run artifact management
├── phases/             # 5-phase pipeline
│   ├── audit.ts
│   ├── analysis.ts
│   ├── recovery.ts
│   ├── fix.ts
│   └── iterate.ts
└── bridge/             # Hook bridge (proxy → monitoring)
    ├── log-reader.ts   # Watches proxy.log
    ├── parser.ts       # Validates TSV format
    ├── transformer.ts  # Maps to event schema
    └── relayer.ts      # POSTs to monitoring server
```

## Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/aaronmiller/delobotomize.git
cd delobotomize

# Install dependencies
bun install

# Build
bun run build
```

### Testing

```bash
# Run tests
bun test

# Validate vendored systems
bun run validate

# Test CLI locally
bun run dev init
bun run dev run
```

### Adding New Phases

To add a new phase:

1. Create `src/phases/new-phase.ts`
2. Export `runNewPhase()` function
3. Add to `src/cli.ts` commands
4. Update phase list in settings template
5. Document in PRD

### Modifying Hook Bridge

The hook bridge is the ONLY active integration code.

**Contract**: 
- Input: TSV from proxy.log
- Output: JSON to monitoring server
- State: None (stateless processing)
- Error handling: Log and continue (never block)

When modifying:
1. Maintain TSV schema compatibility
2. Maintain monitoring event schema compatibility
3. Add tests for new event types
4. Update transformer logic

### Vendored Systems - DO NOT MODIFY

**NEVER** edit code in:
- `integrations/multi-agent-workflow/`
- `integrations/claude-code-proxy/` (except file_logger.py patch)

If you need changes:
1. Report issues upstream
2. Wait for upstream fix
3. Update vendor commit reference
4. Re-vendor the fixed version

## Configuration System

All three systems are configured via `.claude/settings.json`.

**Single source of truth:**
- `delobotomize.*` - Core CLI behavior
- `multi_agent_workflow.*` - Monitoring server config
- `claude_code_proxy.*` - Proxy config

When adding config options:
1. Add to TypeScript interface in `src/config.ts`
2. Add to template in `claude-code/settings.json.template`
3. Document in PRD Section 6
4. Add validation

## Testing Strategy

### Unit Tests
- Phase implementations
- Hook bridge components
- Configuration loading
- Integrity checking

### Integration Tests
- Full pipeline execution
- Bridge → Monitoring communication
- CLI command execution

### Validation
- Vendored code integrity
- License compliance
- Template completeness

## Release Process

1. Update version in `package.json`
2. Run full test suite
3. Run validation scripts
4. Update CHANGELOG
5. Tag release
6. Publish to npm

## Code Style

- TypeScript with strict mode
- ESLint + Prettier
- Async/await (no callbacks)
- Error handling: throw with descriptive messages
- Logging: chalk for colored output, ora for spinners

## Key Principles

1. **Frozen vendored systems** - Never modify black boxes
2. **Human approval required** - No auto-fixes
3. **Reversible changes** - Atomic commits with rollback
4. **Stateless bridge** - Each log line processed independently
5. **Single source of truth** - One config file for all systems

## Questions?

See the complete specification in [prd-15.md](prd-15.md).
