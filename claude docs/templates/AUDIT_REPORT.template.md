# Audit Report

**Run ID**: {{runId}}
**Timestamp**: {{timestamp}}
**Project Path**: {{projectPath}}

## Executive Summary
{{summary}}

## Configuration Discovery
- Total files scanned: {{filesScanned}}
- Configuration files found: {{configFiles}}
- Settings validated: {{settingsValidated}}

## Session Incidents
### Rate Limits
- Total: {{rateLimits}}
- Critical: {{rateLimitsCritical}}

### Refusals
- Total: {{refusals}}
- Pattern: {{refusalPattern}}

### Errors
- Total: {{errors}}
- Types: {{errorTypes}}

## Token Pressure
- Peak utilization: {{peakUtilization}}%
- Average utilization: {{avgUtilization}}%
- Context warnings: {{contextWarnings}}

## Deadlock Detection
- Suspected deadlocks: {{deadlocks}}
- Classification: {{deadlockClassification}}

## Integrity Check
- Status: {{integrityStatus}}
- Differences found: {{integrityDifferences}}

## Next Steps
{{nextSteps}}
