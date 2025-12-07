# Code Quality Scan Skill

<purpose>
Detect code quality issues that indicate AI context collapse or model quality mismatch.
</purpose>

## Capabilities

### 1. Orphaned Code Detection

<capability name="detect_orphaned_code">
**Purpose**: Find exported functions/classes never imported anywhere

**Detection Logic**:
```
FOR each .ts, .js, .py file:
  EXTRACT exports:
    - TypeScript/JS: export (function|class|const) NAME
    - Python: def NAME, class NAME (in __all__)
    
  FOR each export:
    SEARCH codebase for import of NAME
    EXCLUDE: entry points, test files, type definitions
    
    IF zero imports found:
      EMIT: orphaned_export (severity: MEDIUM)
      TRACK count
      
IF orphaned_count > 5:
  INFER: context_collapse (confidence: 0.8)
  NOTE: "Model likely forgot earlier work"
```

**Regex Patterns**:
- Export: `export\\s+(function|class|const|default)\\s+(\\w+)`
- Import check: `import.*\\b{NAME}\\b.*from|require.*{NAME}`

**Root Cause Link**: Many orphaned exports → "Context Collapse" (80% confidence)
</capability>

---

### 2. Unused Dependencies Detection

<capability name="detect_unused_deps">
**Purpose**: Find package.json dependencies not imported anywhere

**Detection Logic**:
```
PARSE package.json → dependencies + devDependencies
EXCLUDE: @types/*, build tools, runtime-only deps

FOR each dependency:
  SEARCH for:
    - import.*from ['"]{dep}
    - require(['"]{dep})
    - dynamic imports
    
  IF no matches:
    EMIT: unused_dependency (severity: LOW)
    
IF unused_count > 3:
  INFER: context_saturation (confidence: 0.7)
  NOTE: "Model may have added deps during earlier context then forgot to use them"
```

**Root Cause Link**: Many unused deps → "Context Saturation" (70% confidence)
</capability>

---

### 3. Undefined Variable Detection

<capability name="detect_undefined_vars">
**Purpose**: Find variable usage without declaration

**Detection Logic**:
```
FOR each .ts, .js file:
  USE AST parser if available, else regex fallback
  
  TRACK:
    - Declarations: const|let|var|function NAME
    - Parameters: (NAME, NAME2)
    - Imports: import { NAME }
    
  FOR each identifier usage:
    IF not in scope chain AND not global:
      EMIT: undefined_variable (severity: HIGH)
      
IF undefined_count > 3:
  INFER: context_collapse (confidence: 0.85)
  NOTE: "Model lost track of variable declarations"
```

**Regex** (fallback):
- Declaration: `(?:const|let|var|function)\\s+(\\w+)`
- Usage without declaration: requires scope tracking

**Root Cause Link**: Undefined variables → "Context Collapse" (85% confidence)
</capability>

---

### 4. Any-Type Detection (TypeScript)

<capability name="detect_any_types">
**Purpose**: Find excessive use of `any` type indicating type system abandonment

**Detection Logic**:
```
FOR each .ts, .tsx file:
  COUNT occurrences of:
    - : any (type annotation)
    - as any (type assertion)
    - <any> (generic)
    
  EXCLUDE:
    - Third-party type definitions
    - Explicit // @ts-ignore with justification
    
  IF count > 10 per file:
    EMIT: excessive_any_types (severity: MEDIUM)
    
IF total_any > 50 across project:
  INFER: model_quality_mismatch (confidence: 0.6)
  NOTE: "Smart model handles loose scoping; this suggests capability exceeded"
```

**Regex**: `:\\s*any\\b|\\bas\\s+any\\b|<any>`

**Root Cause Link**: Excessive any → "Model Quality Mismatch or Poor Scoping" (60% confidence)
</capability>

---

## Aggregated Inference

<inference>
Combined pattern analysis:

| Pattern Combination | Inferred Cause | Confidence |
|--------------------|---------------|------------|
| orphaned + undefined > 5 | **Context Collapse** | 85% |
| unused_deps > 3 + orphaned > 3 | **Context Saturation** | 75% |
| any_types > 50 + sloppy naming | **Model Quality Mismatch** | 65% |
| undefined = 0, orphaned = 0 | **Healthy Codebase** | 90% |
</inference>

## Performance Thresholds

<thresholds>
| Metric | Warning | Error |
|--------|---------|-------|
| Orphaned exports | 3 | 10 |
| Unused dependencies | 2 | 5 |
| Undefined variables | 1 | 3 |
| Any types per file | 5 | 20 |
| Total any types | 20 | 50 |
</thresholds>

## Output Schema

<output>
```json
{
  "skill": "code-quality-scan",
  "timestamp": "ISO8601",
  "findings": [
    {
      "check": "orphaned|unused_dep|undefined_var|any_type",
      "status": "pass|fail|warning",
      "severity": "critical|high|medium|low",
      "message": "string",
      "file": "string",
      "line": "number|null",
      "count": "number",
      "suggested_regex": "string"
    }
  ],
  "aggregate_inference": {
    "cause": "context_collapse|saturation|model_mismatch|healthy",
    "confidence": 0.0-1.0,
    "evidence_count": "number"
  }
}
```
</output>
