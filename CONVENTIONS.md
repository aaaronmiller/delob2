# Delobotomize Coding Conventions

## 1. General Principles
- **Source of Truth**: The `.claude/` directory is the runtime source of truth.
- **Fail Fast**: Pipelines must fail immediately if integrity checks deviate.
- **Human-in-the-Loop**: All destructive actions (Fix phase) require explicit user approval.
- **Black Box Vendoring**: Vendored code in `integrations/` is never modified directly.

## 2. File Naming
- **TypeScript/JavaScript**: `kebab-case.ts` (e.g., `log-reader.ts`)
- **Python**: `snake_case.py` (e.g., `session_start.py`)
- **JSON**: `kebab-case.json` (e.g., `execution-order.json`)
- **Markdown**: `UPPERCASE.md` for root docs (`CLAUDE.md`), `kebab-case.md` for reports (`audit-report.md`)

## 3. Directory Structure
- `src/`: Core tool logic (active development)
- `integrations/`: Vendored systems (frozen)
- `.delobotomize/`: Runtime artifacts (gitignored)
- `.claude/`: User configuration and templates (gitcommitted)

## 4. Logging Standards
### Proxy Logs (`proxy.log`)
Format: TSV
Fields: `TIMESTAMP` | `SESSION_ID` | `METHOD` | `STATUS` | `PROMPT_TOKENS` | `COMPLETION_TOKENS` | `REASONING_TOKENS` | `LATENCY_MS` | `MODEL` | `COST`

### Monitoring Events
Format: JSON
Schema:
```json
{
  "id": "uuid",
  "type": "event_type",
  "timestamp": "ISO8601",
  "session_id": "uuid",
  "project_id": "string",
  "context": {}
}
```

## 5. Error Handling
- Use `try/catch` blocks at phase boundaries.
- Exit with code `1` on fatal errors.
- Use `chalk` for colored CLI output (Red=Error, Yellow=Warning, Green=Success, Blue=Info, Gray=Debug).

## 6. Versioning
- Tool version matches `package.json`.
- Artifact manifests include `version` field.
