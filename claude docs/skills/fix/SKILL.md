# Fix Skill

## Purpose
Apply controlled changes with operator review and git checkpointing.

## Responsibilities
- Create pre-flight git checkpoint
- Apply changes per recovery plan
- Run tests after each change
- Record approvals and diffs
- Commit changes with descriptive messages

## Outputs
- `FIX_REPORT.md`
- `approval-log.json`
- `changes.patch`
- `commits.json`
- `test-results.json`

## Success Criteria
- Git checkpoint created before any writes
- All changes tested
- Atomic commits per plan task
- Rollback available at any point

## Safety
- **Read-only until Fix phase** - This is the ONLY phase that writes to the codebase
- Dry-run mode available
- Operator approval for medium-confidence changes (v1: deferred)
