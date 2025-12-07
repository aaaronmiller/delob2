# /orchestrate - Full Pipeline Execution

Execute the complete Delobotomize forensic pipeline.

## Usage
```
/orchestrate [--phase <name>] [--output <dir>]
```

## Phases

When invoked without flags, runs all phases in sequence:

### Phase 1: Reconnaissance
```
ACTION: Survey project structure
OUTPUT: investigation_manifest.json

STEPS:
1. List top-level directories
2. Identify framework (package.json, pyproject.toml, etc.)
3. Count files by extension
4. Define investigation scope:
   - INCLUDE: src/, lib/, app/, components/, pages/, api/
   - EXCLUDE: node_modules/, venv/, dist/, build/, .git/
5. Check for PRD (prd.md, PRD.md)
6. Check for constitutional (CLAUDE.md, CONVENTIONS.md)
```

### Phase 2: Deep Investigation
```
ACTION: File-by-file forensic analysis
OUTPUT: file_findings.json

STEPS:
FOR each file in scope:
  1. Read file content
  2. Apply LLM fingerprint detection (see skills/llm-fingerprint-detection.md)
  3. Track exports (for orphan detection)
  4. Track imports (for phantom detection)
  5. Record clues with line numbers

LLM FINGERPRINTS TO DETECT:
  - F-HAL-*: Phantom imports, fictional APIs, wrong signatures
  - F-CTX-*: Undefined vars, orphaned exports, circular deps
  - F-MQL-*: Any-types, generic names, copy-paste patterns
  - F-SAT-*: Unused deps, dead code, stale comments
  - F-SET-*: Missing PRD, no constitutional, no tests
```

### Phase 3: Correlation
```
ACTION: Cross-file pattern analysis
OUTPUT: cross_references.json

STEPS:
1. Compare export registry vs import registry
2. Identify orphans (exports never imported)
3. Identify phantoms (imports from non-existent files)
4. Detect patterns:
   - Hallucination cluster (2+ F-HAL-* same area)
   - Context collapse cascade (orphan in A → undefined in B)
   - Midpoint abandonment (quality degrades with line number)
```

### Phase 4: Diagnosis
```
ACTION: Root cause inference
OUTPUT: diagnosis.json

INFERENCE RULES:
IF undefined_vars > 5 OR orphaned_exports > 3:
  → "Context Collapse" (85%)

IF phantom_imports > 0 OR hallucinated_apis > 0:
  → "AI Hallucination" (90%)

IF any_types > 50 OR generic_names > 20:
  → "Model Quality Mismatch" (65%)

IF unused_deps > 3 AND dead_code > 10:
  → "Context Saturation" (75%)

IF missing_prd AND missing_constitutional:
  → "Improper Project Setup" (90%)
```

### Phase 5: Report
```
ACTION: Generate human-readable report
OUTPUT: forensic-report.md, evidence-chain.json

REPORT STRUCTURE:
# Forensic Analysis Report

## Investigation Summary
- Files scanned: X
- Evidence items: Y
- Duration: Z min

## Primary Diagnosis
**Root Cause**: [cause]
**Confidence**: X%

## Evidence Chain
1. [evidence item] → [indication]

## Recommendations
1. [actionable fix]
```

## Output Directory

All outputs written to:
```
.delobotomize/runs/{runId}/
├── investigation_manifest.json
├── file_findings.json
├── cross_references.json
├── diagnosis.json
├── forensic-report.md
└── evidence-chain.json
```

## Single Phase Execution

To run only one phase:
```
/orchestrate --phase reconnaissance
/orchestrate --phase investigation
/orchestrate --phase correlation
/orchestrate --phase diagnosis
/orchestrate --phase report
```

## Example Invocation

```bash
# Headless full pipeline
claude -p "/orchestrate" --dangerously-skip-permissions --output-format stream-json

# Single phase
claude -p "/orchestrate --phase investigation" --dangerously-skip-permissions
```
