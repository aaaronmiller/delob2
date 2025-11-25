import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

/**
 * Analysis Phase
 *
 * Builds causal chains, assigns confidence scores, prioritizes fixes.
 *
 * Precondition: Audit artifacts exist
 * Input: Audit artifacts
 * Output: ANALYSIS.md, WORKFILE.json, DIFFS.txt
 * Duration: <5 minutes
 */
export async function runAnalysis(): Promise<void> {
  const spinner = ora('Running analysis phase...').start();

  try {
    const projectRoot = process.cwd();
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');

    // Find latest run directory
    const runsDir = path.join(delobotomizeDir, 'runs');
    const runs = await fs.readdir(runsDir);
    const latestRun = runs.sort().reverse()[0];

    if (!latestRun) {
      throw new Error('No audit run found. Run audit phase first.');
    }

    const analysisDir = path.join(runsDir, latestRun, 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });

    // Step 1: Load audit artifacts
    spinner.text = 'Loading audit artifacts...';
    const auditDir = path.join(runsDir, latestRun, 'audit');
    const incidents = await loadAuditIncidents(auditDir);

    // Step 2: Build causal chains
    spinner.text = 'Building causal chains...';
    const causalChains = await buildCausalChains(incidents);

    // Step 3: Assign confidence scores
    spinner.text = 'Assigning confidence scores...';
    const scoredIssues = await assignConfidenceScores(causalChains);

    // Step 4: Generate WORKFILE.json
    spinner.text = 'Generating WORKFILE.json...';
    await fs.writeFile(
      path.join(analysisDir, 'WORKFILE.json'),
      JSON.stringify(scoredIssues, null, 2)
    );

    // Step 5: Generate ANALYSIS.md
    spinner.text = 'Generating ANALYSIS.md...';
    const analysisReport = await generateAnalysisReport(scoredIssues);
    await fs.writeFile(
      path.join(analysisDir, 'ANALYSIS.md'),
      analysisReport
    );

    // Step 6: Generate DIFFS.txt (proposed patches)
    spinner.text = 'Generating proposed patches...';
    const diffs = await generateDiffs(scoredIssues);
    await fs.writeFile(
      path.join(analysisDir, 'DIFFS.txt'),
      diffs
    );

    spinner.succeed(chalk.green('✓ Analysis phase completed'));
    console.log(chalk.gray(`  Output: ${analysisDir}`));

  } catch (error) {
    spinner.fail('Analysis phase failed');
    throw error;
  }
}

async function loadAuditIncidents(auditDir: string): Promise<any> {
  const incidentsPath = path.join(auditDir, 'session-incidents.json');
  const inventoryPath = path.join(auditDir, 'file-inventory.json');

  const incidents = JSON.parse(await fs.readFile(incidentsPath, 'utf-8'));
  const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf-8'));

  return { incidents, inventory };
}

async function buildCausalChains(data: any): Promise<any[]> {
  const { incidents, inventory } = data;
  const chains: any[] = [];

  // Analyze rate limits
  if (incidents.rateLimits && incidents.rateLimits.length > 0) {
    chains.push({
      id: 'rate_limit_pattern',
      root_cause: 'Rate Limiting',
      description: `${incidents.rateLimits.length} rate limit events detected`,
      contributing_factors: [
        'High request frequency',
        'Possible retry loops',
        'Inadequate throttling'
      ],
      impact: 'High',
      severity: 'critical',
      affected_sessions: [...new Set(incidents.rateLimits.map((r: any) => r.session_id))],
      evidence: incidents.rateLimits.slice(0, 3),
      suggested_fix: 'Implement exponential backoff, reduce request frequency, or increase rate limits'
    });
  }

  // Analyze stalls
  if (incidents.stalls && incidents.stalls.length > 0) {
    const totalStallTime = incidents.stalls.reduce((sum: number, s: any) => sum + s.duration, 0);
    chains.push({
      id: 'session_stalls',
      root_cause: 'Session Stalls',
      description: `${incidents.stalls.length} stalls detected, ${Math.round(totalStallTime / 60)} minutes total`,
      contributing_factors: [
        'Context saturation',
        'Long-running operations',
        'Network issues',
        'Model processing delays'
      ],
      impact: 'High',
      severity: 'high',
      total_stall_time: totalStallTime,
      stall_count: incidents.stalls.length,
      evidence: incidents.stalls.slice(0, 3),
      suggested_fix: 'Break down large tasks, implement timeouts, add progress indicators'
    });
  }

  // Analyze context saturation
  if (incidents.contextSaturations && incidents.contextSaturations.length > 0) {
    chains.push({
      id: 'context_saturation',
      root_cause: 'Context Window Saturation',
      description: `${incidents.contextSaturations.length} instances of context exceeding 85%`,
      contributing_factors: [
        'Large code files in context',
        'Accumulated conversation history',
        'Inefficient context management'
      ],
      impact: 'Medium',
      severity: 'medium',
      max_usage: Math.max(...incidents.contextSaturations.map((c: any) => c.usage)),
      evidence: incidents.contextSaturations.slice(0, 3),
      suggested_fix: 'Implement context pruning, chunk large files, clear unnecessary history'
    });
  }

  // Analyze reasoning overflows
  if (incidents.reasoningOverflows && incidents.reasoningOverflows.length > 0) {
    chains.push({
      id: 'reasoning_overflow',
      root_cause: 'Reasoning Token Budget Exceeded',
      description: `${incidents.reasoningOverflows.length} instances of reasoning token overflow`,
      contributing_factors: [
        'Complex problem decomposition',
        'Deep analysis requirements',
        'Insufficient budget allocation'
      ],
      impact: 'Medium',
      severity: 'medium',
      max_tokens: Math.max(...incidents.reasoningOverflows.map((r: any) => r.tokens)),
      evidence: incidents.reasoningOverflows.slice(0, 3),
      suggested_fix: 'Increase reasoning budget, simplify problem scope, or break into smaller tasks'
    });
  }

  // Analyze error patterns
  if (incidents.errors && incidents.errors.length > 0) {
    const errorsByStatus = incidents.errors.reduce((acc: any, err: any) => {
      acc[err.status] = (acc[err.status] || 0) + 1;
      return acc;
    }, {});

    chains.push({
      id: 'error_patterns',
      root_cause: 'API Errors',
      description: `${incidents.errors.length} API errors detected`,
      contributing_factors: [
        'Invalid requests',
        'Server issues',
        'Configuration problems'
      ],
      impact: 'Medium',
      severity: 'medium',
      error_breakdown: errorsByStatus,
      evidence: incidents.errors.slice(0, 5),
      suggested_fix: 'Review error logs, validate request formats, check API configuration'
    });
  }

  // Analyze project structure issues
  if (!inventory.hasTests) {
    chains.push({
      id: 'missing_tests',
      root_cause: 'No Test Coverage',
      description: 'Project lacks automated tests',
      contributing_factors: [
        'Development without TDD',
        'Rapid prototyping',
        'Technical debt'
      ],
      impact: 'Low',
      severity: 'low',
      suggested_fix: 'Add unit tests, integration tests, and test automation'
    });
  }

  // Analyze large files
  if (inventory.largeFiles && inventory.largeFiles.length > 0) {
    chains.push({
      id: 'large_files',
      root_cause: 'Large File Sizes',
      description: `${inventory.largeFiles.length} files exceed 1MB`,
      contributing_factors: [
        'Monolithic code structure',
        'Lack of modularization',
        'Generated code not excluded'
      ],
      impact: 'Low',
      severity: 'low',
      large_files: inventory.largeFiles.slice(0, 5),
      suggested_fix: 'Split large files, extract modules, review .gitignore'
    });
  }

  return chains;
}

async function assignConfidenceScores(chains: any[]): Promise<any[]> {
  return chains.map(chain => {
    // Calculate confidence based on evidence strength
    let confidence = 0.5; // base confidence

    // Increase confidence if we have direct evidence
    if (chain.evidence && chain.evidence.length > 0) {
      confidence += 0.2;
    }

    // Increase confidence for high-frequency issues
    if (chain.stall_count > 5 || chain.error_breakdown) {
      confidence += 0.15;
    }

    // Severity affects confidence
    if (chain.severity === 'critical') {
      confidence += 0.15;
    }

    // Cap at 1.0
    confidence = Math.min(confidence, 1.0);

    // Assign priority based on severity and confidence
    let priority = 'low';
    if (chain.severity === 'critical' && confidence > 0.7) {
      priority = 'critical';
    } else if (chain.severity === 'high' || (chain.severity === 'critical' && confidence > 0.5)) {
      priority = 'high';
    } else if (chain.severity === 'medium' && confidence > 0.6) {
      priority = 'medium';
    }

    return {
      ...chain,
      confidence,
      priority
    };
  }).sort((a, b) => {
    // Sort by priority then confidence
    const priorityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
    const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    return priDiff !== 0 ? priDiff : b.confidence - a.confidence;
  });
}

async function generateAnalysisReport(issues: any[]): Promise<string> {
  const critical = issues.filter(i => i.priority === 'critical');
  const high = issues.filter(i => i.priority === 'high');
  const medium = issues.filter(i => i.priority === 'medium');
  const low = issues.filter(i => i.priority === 'low');

  return `# Delobotomize Analysis Report

## Executive Summary
Identified **${issues.length} issues** requiring attention across ${critical.length + high.length} high-priority areas.

### Priority Breakdown
- **Critical**: ${critical.length}
- **High**: ${high.length}
- **Medium**: ${medium.length}
- **Low**: ${low.length}

## Critical Issues
${critical.length > 0 ? critical.map((issue, i) => `
### ${i + 1}. ${issue.root_cause}
**Severity**: ${issue.severity.toUpperCase()} | **Confidence**: ${(issue.confidence * 100).toFixed(0)}% | **Priority**: ${issue.priority.toUpperCase()}

**Description**: ${issue.description}

**Contributing Factors**:
${issue.contributing_factors.map((f: string) => `- ${f}`).join('\n')}

**Impact**: ${issue.impact}

**Suggested Fix**: ${issue.suggested_fix}

${issue.evidence ? `**Evidence** (sample):
\`\`\`json
${JSON.stringify(issue.evidence.slice(0, 2), null, 2)}
\`\`\`
` : ''}
`).join('\n') : '_No critical issues detected._'}

## High Priority Issues
${high.length > 0 ? high.map((issue, i) => `
### ${i + 1}. ${issue.root_cause}
**Confidence**: ${(issue.confidence * 100).toFixed(0)}% | **Severity**: ${issue.severity}

**Description**: ${issue.description}

**Suggested Fix**: ${issue.suggested_fix}
`).join('\n') : '_No high-priority issues detected._'}

## Medium Priority Issues
${medium.length > 0 ? medium.map((issue, i) => `
### ${i + 1}. ${issue.root_cause}
${issue.description}

**Fix**: ${issue.suggested_fix}
`).join('\n') : '_No medium-priority issues detected._'}

## Low Priority Issues
${low.length > 0 ? low.map((issue, i) => `
- **${issue.root_cause}**: ${issue.description}
`).join('\n') : '_No low-priority issues detected._'}

## Recommendations

### Immediate Actions (Critical/High)
${critical.concat(high).map((issue, i) => `
${i + 1}. **${issue.root_cause}**: ${issue.suggested_fix}
`).join('\n')}

### Future Improvements (Medium/Low)
${medium.concat(low).map((issue, i) => `
${i + 1}. **${issue.root_cause}**: ${issue.suggested_fix}
`).join('\n')}

## Next Steps
1. Review this analysis report with your team
2. Prioritize critical and high-priority issues
3. Run recovery phase to generate actionable fix plans
4. Apply fixes with human approval in fix phase

---
Generated: ${new Date().toISOString()}
Delobotomize v15.0
`;
}

async function generateDiffs(issues: any[]): Promise<string> {
  // Generate proposed configuration changes and fixes
  let diffs = `# Proposed Fixes and Patches

This file contains actionable fixes for identified issues.

---

`;

  for (const issue of issues) {
    diffs += `## ${issue.root_cause} (${issue.priority})\n\n`;
    diffs += `**Issue ID**: ${issue.id}\n`;
    diffs += `**Confidence**: ${(issue.confidence * 100).toFixed(0)}%\n\n`;
    diffs += `### Proposed Changes\n\n`;

    // Generate specific fixes based on issue type
    if (issue.id === 'rate_limit_pattern') {
      diffs += `**Configuration Update**: .claude/settings.json\n\n`;
      diffs += `\`\`\`diff
- "request_delay_ms": 0
+ "request_delay_ms": 1000
+ "retry_backoff_factor": 2
+ "max_retries": 3
\`\`\`\n\n`;
    }

    if (issue.id === 'context_saturation') {
      diffs += `**Strategy**: Implement context pruning\n\n`;
      diffs += `1. Split large files into smaller modules\n`;
      diffs += `2. Use .claudeignore to exclude generated files\n`;
      diffs += `3. Clear conversation history periodically\n\n`;
    }

    if (issue.id === 'missing_tests') {
      diffs += `**Action**: Create test structure\n\n`;
      diffs += `\`\`\`bash
mkdir -p tests
touch tests/example.test.ts
\`\`\`\n\n`;
    }

    diffs += `**Manual Fix Required**: ${issue.suggested_fix}\n\n`;
    diffs += `---\n\n`;
  }

  diffs += `\n\nGenerated: ${new Date().toISOString()}\n`;
  diffs += `Delobotomize v15.0\n`;

  return diffs;
}
