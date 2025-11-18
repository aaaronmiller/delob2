import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

/**
 * Iterate Phase
 *
 * Extracts patterns to prevent future failures.
 *
 * Precondition: All previous phases complete
 * Input: All phase artifacts
 * Output: iterate-notes.md
 * Duration: <2 minutes
 */
export async function runIterate(): Promise<void> {
  const spinner = ora('Running iterate phase...').start();

  try {
    const projectRoot = process.cwd();
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');

    // Find latest run directory
    const runsDir = path.join(delobotomizeDir, 'runs');
    const runs = await fs.readdir(runsDir);
    const latestRun = runs.sort().reverse()[0];

    if (!latestRun) {
      throw new Error('No run found. Complete other phases first.');
    }

    const iterateDir = path.join(runsDir, latestRun, 'iterate');
    await fs.mkdir(iterateDir, { recursive: true });

    // Step 1: Load all phase artifacts
    spinner.text = 'Loading phase artifacts...';
    const artifacts = await loadAllArtifacts(runsDir, latestRun);

    // Step 2: Extract patterns
    spinner.text = 'Extracting patterns...';
    const patterns = await extractPatterns(artifacts);

    // Step 3: Generate learnings
    spinner.text = 'Generating learnings...';
    const learnings = await generateLearnings(patterns);

    // Step 4: Write iterate notes
    spinner.text = 'Writing iterate notes...';
    const iterateNotes = await generateIterateNotes(artifacts, patterns, learnings);
    await fs.writeFile(
      path.join(iterateDir, 'iterate-notes.md'),
      iterateNotes
    );

    spinner.succeed(chalk.green('✓ Iterate phase completed'));
    console.log(chalk.gray(`  Output: ${iterateDir}`));

  } catch (error) {
    spinner.fail('Iterate phase failed');
    throw error;
  }
}

async function loadAllArtifacts(runsDir: string, runId: string): Promise<any> {
  const artifacts: any = {
    audit: {},
    analysis: {},
    recovery: {},
    fix: {}
  };

  // Load audit artifacts
  try {
    const auditIncidents = await fs.readFile(
      path.join(runsDir, runId, 'audit', 'session-incidents.json'),
      'utf-8'
    );
    artifacts.audit.incidents = JSON.parse(auditIncidents);
  } catch {}

  // Load analysis artifacts
  try {
    const workfile = await fs.readFile(
      path.join(runsDir, runId, 'analysis', 'WORKFILE.json'),
      'utf-8'
    );
    artifacts.analysis.workfile = JSON.parse(workfile);
  } catch {}

  // Load fix artifacts
  try {
    const approvalLog = await fs.readFile(
      path.join(runsDir, runId, 'fix', 'approval-log.json'),
      'utf-8'
    );
    artifacts.fix.approvalLog = JSON.parse(approvalLog);
  } catch {}

  return artifacts;
}

async function extractPatterns(artifacts: any): Promise<any[]> {
  const patterns: any[] = [];

  // Pattern 1: Repeated errors
  if (artifacts.audit?.incidents?.errors?.length > 0) {
    patterns.push({
      type: 'repeated_errors',
      description: 'Recurring error patterns detected',
      frequency: artifacts.audit.incidents.errors.length
    });
  }

  // Pattern 2: Rate limiting
  if (artifacts.audit?.incidents?.rateLimits?.length > 0) {
    patterns.push({
      type: 'rate_limiting',
      description: 'Rate limit events detected',
      frequency: artifacts.audit.incidents.rateLimits.length
    });
  }

  // Pattern 3: Stalls
  if (artifacts.audit?.incidents?.stalls?.length > 0) {
    patterns.push({
      type: 'stalls',
      description: 'Session stalls detected',
      frequency: artifacts.audit.incidents.stalls.length
    });
  }

  return patterns;
}

async function generateLearnings(patterns: any[]): Promise<any[]> {
  return patterns.map(pattern => ({
    pattern: pattern.type,
    learning: `Consider implementing preventive measures for ${pattern.description}`,
    actionable: true,
    priority: pattern.frequency > 5 ? 'high' : 'medium'
  }));
}

async function generateIterateNotes(artifacts: any, patterns: any[], learnings: any[]): Promise<string> {
  return `# Delobotomize Iterate Notes

## Session Summary

### Artifacts Generated
- Audit: ${artifacts.audit?.incidents ? '✓' : '✗'}
- Analysis: ${artifacts.analysis?.workfile ? '✓' : '✗'}
- Recovery: Plan generated
- Fix: ${artifacts.fix?.approvalLog?.length || 0} fixes evaluated

## Patterns Detected

${patterns.length > 0 ? patterns.map(p => `
### ${p.type}
- **Description**: ${p.description}
- **Frequency**: ${p.frequency}
`).join('\n') : 'No significant patterns detected.'}

## Learnings

${learnings.length > 0 ? learnings.map((l, i) => `
${i + 1}. **${l.pattern}**
   - ${l.learning}
   - Priority: ${l.priority}
   - Actionable: ${l.actionable ? 'Yes' : 'No'}
`).join('\n') : 'No specific learnings extracted.'}

## Recommendations for Future Sessions

1. Review the patterns detected in this session
2. Consider implementing preventive measures
3. Update monitoring thresholds if needed
4. Document any recurring issues

## Next Steps

- Review this document with your team
- Implement recommended preventive measures
- Update project documentation
- Schedule follow-up review

---
Generated: ${new Date().toISOString()}
`;
}
