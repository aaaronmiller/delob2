# Recovery Plan

**Run ID**: {{runId}}
**Generated**: {{timestamp}}
**Overall Confidence**: {{confidence}}%

## Summary
{{summary}}

## Tasks

{{#tasks}}
### Task {{id}}: {{description}}

**Confidence**: {{confidence}}%
**Reversible**: {{reversible}}
**Dependencies**: {{dependencies}}

#### Steps
{{#steps}}
{{stepNumber}}. {{stepDescription}}
{{/steps}}

#### Validation
{{validation}}

#### Rollback
{{rollback}}

---
{{/tasks}}

## Execution Order
{{executionOrder}}

## Risk Assessment
{{riskAssessment}}
