# Forensic Code Analysis Skill

<purpose>
Crime scene detective methodology for analyzing codebases AFTER AI failure has occurred. Examines code artifacts as evidence to infer root cause without requiring telemetry data.
</purpose>

## Philosophy

<philosophy>
You are a **Code Forensics Investigator**. The project before you is a "crime scene" - an AI coding session has failed, and the code itself contains the evidence. Your job is to:

1. **Observe without assumption** - Document what you see before theorizing
2. **Collect evidence systematically** - Every file is a potential clue
3. **Cross-reference findings** - Clues from multiple files form patterns
4. **Build the case** - Correlate evidence to infer root cause
5. **Present findings** - Generate actionable diagnosis
</philosophy>

## Two-Phase Investigation Model

<investigation_model>
### Phase 1: Project Reconnaissance
High-level scan to understand the "scene":
- Identify IDE, framework, language stack
- Locate PRD, constitutional, and config files
- Map directory structure
- Determine which files are "generated code" vs "boilerplate"
- Create investigation scope

### Phase 2: Targeted File Investigation
Deep line-by-line analysis of generated code only:
- Deploy specialized "investigator" for each file type
- Collect clues (anomalies, patterns, fingerprints)
- Cross-reference findings across files
- Build evidence chain
</investigation_model>

## Evidence Categories

<evidence_categories>
### Category A: Context Collapse Indicators
Signs the AI lost track of what it was building:

| Evidence Type | Detection Method | Confidence |
|--------------|-----------------|------------|
| Undefined variables | Used but never declared | 95% |
| Orphaned exports | Exported but never imported | 90% |
| Duplicate function names | Same name, different implementations | 85% |
| Contradictory logic | if(x) followed by if(!x) in same flow | 80% |
| Incomplete implementations | TODO/FIXME with no resolution | 75% |
| Circular dependencies | A imports B, B imports A | 85% |

### Category B: Model Quality Mismatch
Signs the task exceeded model capability:

| Evidence Type | Detection Method | Confidence |
|--------------|-----------------|------------|
| Excessive `any` types | > 10 per file or > 50 total | 70% |
| Generic variable names | x, temp, data, result used heavily | 65% |
| Copy-paste patterns | Repeated code blocks with slight variations | 75% |
| Over-engineered solutions | Complex code for simple tasks | 60% |
| Inconsistent style | Mixed naming conventions in same file | 70% |

### Category C: Hallucination Artifacts
Signs the AI invented non-existent things:

| Evidence Type | Detection Method | Confidence |
|--------------|-----------------|------------|
| Non-existent imports | Import from package not in dependencies | 95% |
| Hallucinated APIs | Method calls that don't exist on objects | 90% |
| Phantom files | Imports from files that don't exist | 95% |
| Made-up libraries | require('fictional-package') | 90% |
| Incorrect method signatures | Wrong number of arguments | 85% |

### Category D: Context Saturation
Signs the AI forgot earlier work:

| Evidence Type | Detection Method | Confidence |
|--------------|-----------------|------------|
| Unused dependencies | In package.json but never imported | 80% |
| Dead code blocks | Functions defined but never called | 75% |
| Redundant re-implementations | Same logic written multiple times | 85% |
| Stale comments | Comments describing deleted code | 70% |
| Import graveyard | Multiple commented-out imports | 75% |

### Category E: Setup/Planning Failures
Signs the project was poorly scaffolded:

| Evidence Type | Detection Method | Confidence |
|--------------|-----------------|------------|
| Missing PRD | No prd.md, PRD.md, or requirements doc | 90% |
| Missing constitutional | No CLAUDE.md or CONVENTIONS.md | 85% |
| No .claudeignore | Large files in context | 70% |
| Missing type definitions | No tsconfig.json in TypeScript project | 75% |
| No test structure | No test files or test directory | 65% |
</evidence_categories>

## File Filtering Logic

<file_filtering>
### Include (Generated Code)
```
INCLUDE files matching:
  - src/**/*.{ts,js,tsx,jsx,py}
  - app/**/*.{ts,js,tsx,jsx}
  - lib/**/*.{ts,js,py}
  - components/**/*
  - pages/**/*
  - api/**/*
  - Custom directories identified from package.json/pyproject.toml
```

### Exclude (Boilerplate/Dependencies)
```
EXCLUDE directories:
  - node_modules/
  - venv/, .venv/, env/
  - __pycache__/
  - .git/
  - dist/, build/, out/
  - .next/, .nuxt/
  - coverage/

EXCLUDE files:
  - *.lock (package-lock.json, yarn.lock, etc.)
  - *.min.js, *.bundle.js
  - Generated type definitions (*.d.ts in node_modules)
  - Configuration files (unless malformed)
```

### Identification Heuristics
```
TO identify generated vs boilerplate:
  1. Check package.json "main", "source" fields
  2. Check tsconfig.json "include" paths
  3. Look for .gitignore patterns
  4. Files modified in last 30 days more likely generated
  5. Files with AI-style comments ("// Generated by", etc.)
```
</file_filtering>

## Investigation Protocol

<protocol>
### Step 1: Scene Assessment (2 min)
```
LIST all top-level directories
IDENTIFY framework (Next.js, Express, Django, etc.)
LOCATE configuration files
COUNT total files vs generated files
CREATE investigation_scope.json
```

### Step 2: Document Scan (3 min)
```
SEARCH for PRD files
SEARCH for constitutional files (CLAUDE.md, CONVENTIONS.md)
SEARCH for TODO/task files
EVALUATE completeness of documentation
LOG findings to evidence_log.json
```

### Step 3: Dependency Audit (2 min)
```
PARSE package.json or pyproject.toml
EXTRACT all dependencies
PREPARE for unused dependency detection
LOG dependency_manifest.json
```

### Step 4: File-by-File Investigation (10-30 min)
```
FOR each file in investigation_scope:
  INVOKE file_investigator
  COLLECT clues[]
  TRACK cross_references[]
  LOG to file_findings.json
```

### Step 5: Cross-Reference Analysis (5 min)
```
AGGREGATE all clues
IDENTIFY patterns across files
CORRELATE evidence to categories
CALCULATE confidence scores
GENERATE root_cause_inference
```

### Step 6: Report Generation (2 min)
```
CREATE forensic_report.md (human-readable)
CREATE evidence_chain.json (machine-readable)
INCLUDE remediation recommendations
```
</protocol>

## Output Schema

<output>
### evidence_chain.json
```json
{
  "investigation_id": "string",
  "timestamp": "ISO8601",
  "scope": {
    "total_files": number,
    "investigated_files": number,
    "excluded_directories": ["string"]
  },
  "evidence": [
    {
      "id": "EVD-001",
      "category": "context_collapse|model_mismatch|hallucination|saturation|setup",
      "type": "string",
      "file": "string",
      "line": number,
      "snippet": "string",
      "confidence": 0.0-1.0
    }
  ],
  "cross_references": [
    {
      "evidence_ids": ["EVD-001", "EVD-003"],
      "pattern": "string",
      "significance": "string"
    }
  ],
  "inferred_cause": {
    "primary": "string",
    "secondary": ["string"],
    "confidence": 0.0-1.0,
    "evidence_count": number
  },
  "recommendations": ["string"]
}
```
</output>

## Integration with Agents

<integration>
This skill is invoked by:
- **Auditor Agent**: During comprehensive project scan
- **Analyst Agent**: For deep-dive file analysis
- **Iterator Agent**: To extract patterns for future detection
</integration>
