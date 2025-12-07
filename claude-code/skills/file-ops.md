# File Operations Skill

<purpose>
Safe, atomic file manipulation operations that prevent data loss during AI-driven code modifications.
</purpose>

## Capabilities

### read_safe

<capability name="read_safe">
Read a file with comprehensive error handling.

**Signature**: `read_safe(path: string, options?: {encoding?: string, fallback?: string})`

**Behavior**:
1. Check file exists
2. Validate encoding (default: utf-8)
3. Handle missing files gracefully
4. Return content or fallback value

**Error Handling**:
- Missing file: Return fallback or throw descriptive error
- Encoding error: Attempt binary read, log warning
- Permission denied: Throw with remediation suggestion

**Example**:
```typescript
const content = await read_safe('./config.json', { fallback: '{}' });
```
</capability>

---

### write_atomic

<capability name="write_atomic">
Write to a file atomically using temporary file + rename pattern.

**Signature**: `write_atomic(path: string, content: string, options?: {backup?: boolean})`

**Behavior**:
1. Write to `{path}.tmp.{random}`
2. Optionally create backup of original
3. Rename temp to target (atomic on POSIX)
4. Clean up on failure

**Why Atomic**:
Prevents corrupted files if process crashes mid-write. Critical for maintaining codebase integrity during AI modifications.

**Example**:
```typescript
await write_atomic('./settings.json', JSON.stringify(config), { backup: true });
```
</capability>

---

### backup_file

<capability name="backup_file">
Create timestamped backup copy before modification.

**Signature**: `backup_file(path: string, options?: {suffix?: string})`

**Behavior**:
1. Generate timestamp: `YYYYMMDD_HHMMSS`
2. Copy to `{path}.backup.{timestamp}`
3. Return backup path for rollback reference

**Use Case**:
Always backup before AI-driven modifications to enable rollback.

**Example**:
```typescript
const backupPath = await backup_file('./important.ts');
// backupPath = './important.ts.backup.20251206_235500'
```
</capability>

---

### diff_files

<capability name="diff_files">
Compare two files and return unified diff.

**Signature**: `diff_files(original: string, modified: string)`

**Behavior**:
1. Read both files
2. Generate unified diff format
3. Return diff string for review

**Use Case**:
Show proposed changes before applying fixes in the Fix phase.
</capability>

---

## Safety Guidelines

<safety>
- Always use `write_atomic` for modifications
- Create backups before destructive operations
- Validate file existence before reads
- Log all file operations for audit trail
</safety>
