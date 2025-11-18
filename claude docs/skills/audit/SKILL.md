# Audit Skill

## Purpose
Enumerate files, validate configuration integrity, and create initial findings from session activity.

## Responsibilities
- Read proxy logs from `.delobotomize/proxy.log`
- Analyze session incidents (rate limits, refusals, errors)
- Detect token pressure and context saturation
- Identify suspected deadlocks
- Verify `.claude/` matches `claude docs/`

## Outputs
- `AUDIT_REPORT.md`
- `file-inventory.json`
- `config-discovery.json`
- `settings-validation.json`
- `claude-docs-integrity.json`

## Success Criteria
- ≥90% config discovery
- Zero drift between `.claude/` and `claude docs/`
- Complete session incident enumeration
- Execution under 10 minutes (warning threshold)
