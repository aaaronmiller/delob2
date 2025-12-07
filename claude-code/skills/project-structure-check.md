# Project Structure Check Skill

<purpose>
Detect missing or malformed project structure elements that commonly cause AI context collapse.
</purpose>

## Capabilities

### 1. PRD File Detection

<capability name="check_prd">
**Purpose**: Verify project has a valid Product Requirements Document

**Detection Logic**:
```
SEARCH for files matching:
  - prd.md, PRD.md, *-prd.md
  - product-requirements*.md
  - requirements.md (fallback)

IF no match:
  EMIT: missing_prd (severity: HIGH)
  INFER: improper_project_instantiation

ELSE:
  VALIDATE contains at least:
    - One ## header
    - 200+ words of content
  IF validation fails:
    EMIT: invalid_prd_format (severity: MEDIUM)
```

**Regex**: `(?i)(^|/)prd\.md$|product.?requirements.*\.md$`

**Root Cause Link**: Missing PRD → "Improper Project Setup" (90% confidence)
</capability>

---

### 2. Gated Todo Validation

<capability name="check_gated_todos">
**Purpose**: Ensure todo items have clear completion criteria

**Detection Logic**:
```
FIND all patterns: - [ ] (unchecked todo items)

FOR each match:
  CHECK if line or next 2 lines contain:
    - gate:, criteria:, done when:
    - ✓ when, completion:, verify:
  
  IF no gate found:
    EMIT: ungated_todo (severity: LOW)
    COUNT total ungated items
    
IF ungated_count > 10:
  ESCALATE severity to MEDIUM
  INFER: lack_of_verification_gates
```

**Regex**: `^\\s*-\\s*\\[\\s*\\]\\s+(?!.*(?:gate:|criteria:|done when:|verify:))`

**Root Cause Link**: Many ungated todos → "Lack of Verification Gates" (85% confidence)
</capability>

---

### 3. Constitutional File Detection

<capability name="check_constitutional">
**Purpose**: Verify project has AI guidance documentation

**Detection Logic**:
```
SEARCH for files:
  - CLAUDE.md (primary)
  - CONVENTIONS.md
  - .claude/CLAUDE.md
  - CONTRIBUTING.md (fallback)

IF no match:
  EMIT: missing_constitutional (severity: HIGH)
  SUGGEST: Create CLAUDE.md with project conventions

ELSE:
  VALIDATE contains:
    - Role definition
    - Behavioral guidelines
  IF validation fails:
    EMIT: weak_constitutional (severity: MEDIUM)
```

**Regex**: `(?i)^(claude|conventions|contributing)\.md$`

**Root Cause Link**: Missing constitutional → "Improper Project Setup" (90% confidence)
</capability>

---

## Aggregated Inference

<inference>
When multiple checks fail:

| Pattern | Inferred Cause | Confidence |
|---------|---------------|------------|
| missing_prd + missing_constitutional | **Improper Project Instantiation** | 95% |
| ungated_todos > 10 | **Lack of Verification Gates** | 85% |
| invalid_prd + weak_constitutional | **Incomplete Setup** | 75% |
</inference>

## Output Schema

<output>
```json
{
  "skill": "project-structure-check",
  "timestamp": "ISO8601",
  "findings": [
    {
      "check": "prd|todo_gates|constitutional",
      "status": "pass|fail",
      "severity": "critical|high|medium|low",
      "message": "string",
      "file": "string|null",
      "line": "number|null",
      "suggested_regex": "string",
      "inferred_cause": "string|null"
    }
  ],
  "aggregate_inference": {
    "cause": "string",
    "confidence": 0.0-1.0
  }
}
```
</output>
