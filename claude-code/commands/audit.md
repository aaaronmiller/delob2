---
name: audit
description: Run comprehensive project audit with failure pattern detection
usage: /audit [path] [--deep] [--quick]
aliases:
  - /scan
  - /check
---

# /audit Command

<purpose>
Runs the Delobotomize audit phase on the specified path, detecting failure patterns that commonly cause AI context collapse.
</purpose>

## Usage

```bash
/audit                    # Audit current directory
/audit ./src              # Audit specific path
/audit --deep             # Include dependency analysis
/audit --quick            # Structure check only
```

## Execution Steps

<steps>
1. **Integrity Validation**
   - Verify `.claude/` directory exists
   - Check checksums against `claude-docs-integrity.json`
   - Flag any drift from source templates

2. **Structure Scan**
   - Enumerate all files and directories
   - Identify large files (>1MB)
   - Detect missing critical files (PRD, constitutional)

3. **Proxy Log Analysis**
   - Parse `.delobotomize/proxy.log` if exists
   - Extract session incidents (rate limits, errors, stalls)
   - Calculate token usage and cost metrics

4. **Quality Scan** (invoke skills)
   - `project-structure-check`: PRD, todos, constitutional
   - `code-quality-scan`: Orphaned code, unused deps, any-types

5. **Root Cause Inference**
   - Correlate findings to infer failure cause
   - Assign confidence scores
   - Generate actionable recommendations

6. **Report Generation**
   - Create `audit-report.md` (human-readable)
   - Create `file-inventory.json` (machine-readable)
   - Create `session-incidents.json` (telemetry)
</steps>

## Output Location

```
.delobotomize/runs/{run_id}/audit/
├── audit-report.md
├── file-inventory.json
└── session-incidents.json
```

## Self-Validation

<self_validation>
Before completing audit, verify:
- [ ] All directories were successfully traversed
- [ ] Large file detection completed
- [ ] Proxy log was parsed (or noted as missing)
- [ ] At least one finding was generated (even if "no issues")
</self_validation>

## Error Handling

<error_handling>
- If directory unreadable: Log warning, continue with accessible paths
- If proxy log missing: Note in report, continue without telemetry
- If integrity check fails: Emit critical finding, suggest re-init
</error_handling>
