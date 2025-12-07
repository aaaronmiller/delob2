# File Investigator Skill

<purpose>
Deep line-by-line analysis of individual source files to collect evidence of LLM failure patterns. Works as the "field investigator" deployed by the forensic-analysis skill.
</purpose>

## Investigation Approach

<approach>
For each file, act as a meticulous detective:

1. **First Pass**: Scan for obvious anomalies (syntax, structure)
2. **Second Pass**: Semantic analysis (logic, data flow)
3. **Third Pass**: Cross-reference check (imports, exports, calls)
4. **Document**: Record every clue with line number and snippet
</approach>

## Language-Specific Analyzers

<analyzers>
### TypeScript/JavaScript Analyzer

```
SCAN for:
  1. Type Issues
     - `: any` usage (count and location)
     - `as any` type assertions
     - Missing return types on functions
     - `@ts-ignore` comments
     
  2. Variable Issues
     - Declared but unused variables
     - Used but undeclared variables
     - Shadowed variables
     - `var` usage (outdated pattern)
     
  3. Import Issues
     - Imports from non-existent paths
     - Unused imports
     - Duplicate imports
     - Circular import patterns
     
  4. Function Issues
     - Exported but never imported elsewhere
     - Defined but never called
     - Inconsistent return types
     - Empty function bodies
     
  5. Logic Issues
     - Unreachable code after return
     - Conditions that are always true/false
     - Empty catch blocks
     - Commented-out code blocks
     
  6. AI Fingerprints
     - Generic comments ("// Handle error", "// TODO: implement")
     - Placeholder values ("example", "test123", "foo", "bar")
     - Inconsistent naming (camelCase mixed with snake_case)
     - Over-complicated one-liners
```

### Python Analyzer

```
SCAN for:
  1. Type Issues
     - Missing type hints on function signatures
     - `Any` type usage
     - `# type: ignore` comments
     
  2. Variable Issues
     - Undefined name references
     - Unused variables (assigned but never read)
     - Global variable abuse
     
  3. Import Issues
     - Imports from non-existent modules
     - Unused imports
     - Star imports (`from x import *`)
     - Relative import issues
     
  4. Function Issues
     - Defined but never called
     - `pass` as only body (stub)
     - Mutable default arguments
     
  5. Logic Issues
     - Unreachable code
     - Bare except clauses
     - Using `==` instead of `is` for None
     - Empty except/finally
     
  6. AI Fingerprints
     - Generic docstrings
     - Placeholder values
     - Mixed naming conventions
```
</analyzers>

## Clue Collection Format

<clue_format>
For each anomaly detected, record:

```json
{
  "clue_id": "CLU-{file_hash}-{line}",
  "file": "relative/path/to/file.ts",
  "line": 42,
  "column": 15,
  "category": "type_issue|variable_issue|import_issue|function_issue|logic_issue|ai_fingerprint",
  "type": "specific_issue_type",
  "snippet": "const data: any = fetchData();",
  "context": {
    "before": "// Previous 2 lines",
    "after": "// Next 2 lines"
  },
  "severity": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "cross_ref_hint": "Check if 'fetchData' is defined elsewhere"
}
```
</clue_format>

## Pattern Recognition

<patterns>
### Pattern: Context Collapse Signature
When multiple related issues appear together:
```
IF file contains:
  - Undefined variable X (line 50)
  - Function using X exists (line 100)
  - No import for X's source
THEN:
  INFER: Context collapsed between lines 50-100
  CONFIDENCE: 85%
```

### Pattern: Hallucination Cluster
```
IF file contains:
  - Import from fictional package
  - Method calls on undefined objects
  - References to non-existent files
THEN:
  INFER: AI hallucinated this code block
  CONFIDENCE: 90%
```

### Pattern: Copy-Paste Decay
```
IF file contains:
  - 3+ similar code blocks with slight variations
  - Inconsistent variable names in similar contexts
  - Repeated error handling with different approaches
THEN:
  INFER: AI copy-pasted and failed to maintain consistency
  CONFIDENCE: 75%
```

### Pattern: Abandonment Syndrome
```
IF file contains:
  - Multiple TODO/FIXME comments
  - Empty function bodies
  - Commented-out alternative implementations
THEN:
  INFER: AI abandoned implementation mid-task
  CONFIDENCE: 80%
```
</patterns>

## Investigation Checklist

<checklist>
Before completing file investigation, verify:

- [ ] Scanned all lines (not just first 100)
- [ ] Recorded line numbers for every clue
- [ ] Captured code snippets for evidence
- [ ] Noted cross-reference hints for later
- [ ] Assigned severity and confidence
- [ ] Identified any multi-clue patterns
</checklist>

## Cross-File Tracking

<cross_file>
Maintain running lists across all investigated files:

### Export Registry
```json
{
  "exports": [
    {"file": "utils.ts", "name": "formatDate", "type": "function", "line": 15}
  ]
}
```

### Import Registry
```json
{
  "imports": [
    {"file": "app.ts", "from": "utils.ts", "name": "formatDate", "line": 3}
  ]
}
```

### Orphan Detection
```
AFTER all files investigated:
  FOR each export in export_registry:
    IF no matching import in import_registry:
      EMIT: orphaned_export evidence
```

### Phantom Detection
```
AFTER all files investigated:
  FOR each import in import_registry:
    IF source file does not exist:
      EMIT: phantom_import evidence (HALLUCINATION)
```
</cross_file>

## Performance Optimization

<performance>
To avoid context overflow during investigation:

1. **Chunk large files**: Process 200 lines at a time
2. **Summarize patterns**: Don't repeat same clue type 10 times
3. **Priority scan**: Focus on src/, lib/, app/ first
4. **Skip minified**: Detect and skip .min.js files
5. **Token budget**: Reserve 20% for final report generation
</performance>

## Output

<output>
Return per-file findings:

```json
{
  "file": "string",
  "investigation_status": "complete|partial|skipped",
  "skip_reason": "minified|too_large|boilerplate|null",
  "line_count": number,
  "clues": [...clue_objects],
  "patterns_detected": ["pattern_name"],
  "cross_ref_hints": ["string"],
  "summary": "Brief one-line summary of file health"
}
```
</output>
