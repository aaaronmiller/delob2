# Recovery Skill

## Purpose
Generate executable recovery plans with validation and dependency ordering.

## Responsibilities
- Plan task generation from analysis results
- Validate plans for conflicts and circular dependencies
- Build execution order respecting dependencies
- Assess reversibility of proposed changes
- Confidence scoring per task

## Outputs
- `RECOVERY_SUMMARY.md`
- `plan-*.md` (one per task)
- `execution-order.json`

## Success Criteria
- Complete plan sections for all tasks
- Reversible rollback strategy
- Executable test commands
- Justified confidence scores
- No circular dependencies
