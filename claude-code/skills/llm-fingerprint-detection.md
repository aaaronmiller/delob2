# LLM Fingerprint Detection Skill

<purpose>
Catalog of specific code patterns that indicate LLM-generated code failures. These are the "fingerprints" left behind when an AI coding session goes wrong.
</purpose>

## Fingerprint Categories

<fingerprints>

### Category 1: Hallucination Fingerprints
Code that references things that don't exist.

#### F-HAL-001: Phantom Import
```
PATTERN: Import from non-existent file or package
DETECTION:
  - import X from './path/that/does/not/exist'
  - require('fictional-package') not in package.json
CONFIDENCE: 95%
SEVERITY: Critical
```

#### F-HAL-002: Fictional API Call
```
PATTERN: Method call on object that doesn't have that method
DETECTION:
  - array.sortBy() (not a standard method)
  - string.capitalize() (not in JS/TS)
  - object.deepClone() (fictional)
CONFIDENCE: 90%
SEVERITY: High
```

#### F-HAL-003: Wrong Method Signature
```
PATTERN: Calling function with wrong number/type of arguments
DETECTION:
  - fs.readFile(path) (missing callback in callback version)
  - map(item, index, array, extra) (too many params)
CONFIDENCE: 85%
SEVERITY: High
```

#### F-HAL-004: Invented Constants
```
PATTERN: Using constants that don't exist in the framework
DETECTION:
  - HTTP_STATUS.SUCCESS (not standard)
  - React.FRAGMENT_TYPE (fictional)
CONFIDENCE: 80%
SEVERITY: Medium
```

---

### Category 2: Context Collapse Fingerprints
Code showing the AI lost track of the codebase.

#### F-CTX-001: Undefined Variable Usage
```
PATTERN: Variable used but never declared in scope
DETECTION:
  - console.log(userData) where userData is never defined
  - return result where result is not declared
REGEX: /\b(\w+)\b/ where \1 not in scope_chain
CONFIDENCE: 95%
SEVERITY: Critical
```

#### F-CTX-002: Orphaned Export
```
PATTERN: Function exported but never imported anywhere
DETECTION:
  - export function helperFn() in utils.ts
  - No file contains import { helperFn } from './utils'
CONFIDENCE: 90%
SEVERITY: Medium
```

#### F-CTX-003: Duplicate Definition
```
PATTERN: Same function/variable defined multiple times
DETECTION:
  - function processData() on line 50
  - function processData() on line 200 (different implementation)
CONFIDENCE: 85%
SEVERITY: High
```

#### F-CTX-004: Contradictory Logic
```
PATTERN: Opposite conditions in same code path
DETECTION:
  - if (isValid) { ... }
  - if (!isValid) { ... } // Right after, same scope
CONFIDENCE: 80%
SEVERITY: Medium
```

#### F-CTX-005: Circular Dependency
```
PATTERN: A imports B, B imports A
DETECTION:
  - Build import graph
  - Find cycles
CONFIDENCE: 85%
SEVERITY: High
```

---

### Category 3: Model Quality Mismatch Fingerprints
Code showing task exceeded model capability.

#### F-MQL-001: Any-Type Explosion
```
PATTERN: Excessive use of 'any' type in TypeScript
DETECTION:
  - Count `: any` occurrences
  - Threshold: >10 per file or >50 total
REGEX: /:\s*any\b|\bas\s+any\b/g
CONFIDENCE: 70%
SEVERITY: Medium
```

#### F-MQL-002: Generic Variable Names
```
PATTERN: Variables named without semantic meaning
DETECTION:
  - data, result, temp, x, y, item, value, obj
  - Count threshold: >20 in project
REGEX: /\b(data|result|temp|item|value|obj|x|y)\b/g
CONFIDENCE: 65%
SEVERITY: Low
```

#### F-MQL-003: Copy-Paste Syndrome
```
PATTERN: Nearly identical code blocks repeated
DETECTION:
  - 3+ blocks with >80% similarity
  - Same logic, different variable names
CONFIDENCE: 75%
SEVERITY: Medium
```

#### F-MQL-004: Over-Engineering
```
PATTERN: Complex solution for simple problem
DETECTION:
  - Factory pattern for single-use class
  - Abstract base class with one implementation
  - 5+ levels of nesting
CONFIDENCE: 60%
SEVERITY: Low
```

#### F-MQL-005: Inconsistent Style
```
PATTERN: Mixed conventions in same file
DETECTION:
  - camelCase AND snake_case in same file
  - Tabs AND spaces mixed
  - 'single quotes' AND "double quotes"
CONFIDENCE: 70%
SEVERITY: Low
```

---

### Category 4: Context Saturation Fingerprints
Code showing AI forgot earlier work.

#### F-SAT-001: Unused Dependencies
```
PATTERN: Package in dependencies but never imported
DETECTION:
  - "lodash" in package.json
  - No import from 'lodash' in any file
CONFIDENCE: 80%
SEVERITY: Low
```

#### F-SAT-002: Dead Code
```
PATTERN: Function defined but never called
DETECTION:
  - function formatCurrency() defined
  - grep -r "formatCurrency" returns only definition
CONFIDENCE: 75%
SEVERITY: Medium
```

#### F-SAT-003: Stale Comments
```
PATTERN: Comments describing code that doesn't exist
DETECTION:
  - // Calculate tax rate
  - Next line: return data; (no tax calculation)
CONFIDENCE: 70%
SEVERITY: Low
```

#### F-SAT-004: Import Graveyard
```
PATTERN: Multiple commented-out imports
DETECTION:
  - // import { old } from './old'
  - // import { deprecated } from './deprecated'
REGEX: /^\/\/\s*import\s+/gm
CONFIDENCE: 75%
SEVERITY: Low
```

#### F-SAT-005: Redundant Re-implementation
```
PATTERN: Same logic implemented multiple times
DETECTION:
  - parseDate() in utils.ts
  - formatDateString() doing same thing in helpers.ts
CONFIDENCE: 85%
SEVERITY: Medium
```

---

### Category 5: Setup Failure Fingerprints
Code showing poor project scaffolding.

#### F-SET-001: Missing PRD
```
PATTERN: No requirements document
DETECTION:
  - !exists('prd.md') AND !exists('PRD.md')
  - !exists('requirements.md')
CONFIDENCE: 90%
SEVERITY: High
```

#### F-SET-002: No Constitutional File
```
PATTERN: No AI guidance document
DETECTION:
  - !exists('CLAUDE.md')
  - !exists('CONVENTIONS.md')
CONFIDENCE: 85%
SEVERITY: High
```

#### F-SET-003: Missing Claudeignore
```
PATTERN: Large files would pollute context
DETECTION:
  - !exists('.claudeignore')
  - node_modules/ not in .gitignore (proxy for .claudeignore)
CONFIDENCE: 70%
SEVERITY: Medium
```

#### F-SET-004: No Type Config
```
PATTERN: TypeScript without proper configuration
DETECTION:
  - .ts files exist
  - !exists('tsconfig.json') OR tsconfig has "strict": false
CONFIDENCE: 75%
SEVERITY: Medium
```

#### F-SET-005: No Tests
```
PATTERN: No test infrastructure
DETECTION:
  - !exists('test/') AND !exists('tests/') AND !exists('__tests__/')
  - No *.test.ts, *.spec.ts files
CONFIDENCE: 65%
SEVERITY: Medium
```

---

### Category 6: AI Comment Fingerprints
Comments that reveal AI authorship.

#### F-CMT-001: Generic TODO
```
PATTERN: Vague TODO without specifics
DETECTION:
  - // TODO: implement
  - // TODO: fix this
  - // TODO: add error handling
REGEX: /\/\/\s*TODO:\s*(implement|fix|add|handle)/gi
CONFIDENCE: 70%
SEVERITY: Low
```

#### F-CMT-002: Placeholder Comment
```
PATTERN: Generic descriptive comment
DETECTION:
  - // Handle error
  - // Process data
  - // Return result
REGEX: /\/\/\s*(Handle|Process|Return|Get|Set)\s+\w+$/gm
CONFIDENCE: 65%
SEVERITY: Low
```

#### F-CMT-003: Obvious Comment
```
PATTERN: Comment stating what code already says
DETECTION:
  - // Increment counter
  - count++
CONFIDENCE: 60%
SEVERITY: Low
```

</fingerprints>

## Detection Protocol

<detection_protocol>
### Quick Scan (Fast)
Run regex-based detection for high-confidence patterns:
1. F-CTX-001 (undefined vars) - if linting available
2. F-HAL-001 (phantom imports) - file existence check
3. F-MQL-001 (any-types) - regex count
4. F-SET-001, F-SET-002 (missing docs) - file existence

### Deep Scan (Thorough)
Full AST analysis where available:
1. Build import/export graph
2. Track variable scope chains
3. Detect orphans and phantoms
4. Identify code similarity clusters
</detection_protocol>

## Scoring Matrix

<scoring>
| Fingerprint | Weight | Notes |
|-------------|--------|-------|
| F-HAL-* | 3x | Hallucinations are definitive failures |
| F-CTX-* | 2x | Context collapse is primary failure mode |
| F-MQL-* | 1x | Quality issues are secondary |
| F-SAT-* | 1.5x | Saturation indicates session degradation |
| F-SET-* | 2x | Setup failures are preventable |
| F-CMT-* | 0.5x | Comments are weak signals |

**Total Evidence Score** = Σ(fingerprint_count × weight × confidence)
</scoring>

## Output

<output>
```json
{
  "fingerprints_detected": [
    {
      "id": "F-HAL-001",
      "name": "Phantom Import",
      "instances": [
        {"file": "...", "line": 42, "code": "import {...}"}
      ],
      "count": 3,
      "weighted_score": 8.55
    }
  ],
  "total_score": number,
  "primary_category": "hallucination|context_collapse|model_mismatch|saturation|setup",
  "confidence": 0.0-1.0
}
```
</output>
