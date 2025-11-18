import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

/**
 * Recovery Phase
 *
 * Generates step-by-step recovery plans with rollback procedures.
 *
 * Precondition: Analysis artifacts exist
 * Input: WORKFILE.json, ANALYSIS.md
 * Output: recovery-plan.md, execution-order.json
 * Duration: <3 minutes
 */
export async function runRecovery(): Promise<void> {
  const spinner = ora('Running recovery phase...').start();

  try {
    const projectRoot = process.cwd();
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');

    // Find latest run directory
    const runsDir = path.join(delobotomizeDir, 'runs');
    const runs = await fs.readdir(runsDir);
    const latestRun = runs.sort().reverse()[0];

    if (!latestRun) {
      throw new Error('No analysis run found. Run analysis phase first.');
    }

    const recoveryDir = path.join(runsDir, latestRun, 'recovery');
    await fs.mkdir(recoveryDir, { recursive: true });

    // Step 1: Load analysis artifacts
    spinner.text = 'Loading analysis artifacts...';
    const analysisDir = path.join(runsDir, latestRun, 'analysis');
    const workfile = await loadWorkfile(analysisDir);

    // Step 2: Generate recovery plan
    spinner.text = 'Generating recovery plan...';
    const recoveryPlan = await generateRecoveryPlan(workfile);
    await fs.writeFile(
      path.join(recoveryDir, 'recovery-plan.md'),
      recoveryPlan
    );

    // Step 3: Generate execution order
    spinner.text = 'Determining execution order...';
    const executionOrder = await generateExecutionOrder(workfile);
    await fs.writeFile(
      path.join(recoveryDir, 'execution-order.json'),
      JSON.stringify(executionOrder, null, 2)
    );

    spinner.succeed(chalk.green('✓ Recovery phase completed'));
    console.log(chalk.gray(`  Output: ${recoveryDir}`));

  } catch (error) {
    spinner.fail('Recovery phase failed');
    throw error;
  }
}

async function loadWorkfile(analysisDir: string): Promise<any> {
  const workfilePath = path.join(analysisDir, 'WORKFILE.json');
  const content = await fs.readFile(workfilePath, 'utf-8');
  return JSON.parse(content);
}

async function generateRecoveryPlan(workfile: any[]): Promise<string> {
  return `# Delobotomize Recovery Plan

## Overview
This recovery plan addresses ${workfile.length} identified issues.

## Recovery Steps

${workfile.map((issue, i) => `
### Step ${i + 1}: Fix ${issue.root_cause}
**Priority**: ${issue.priority}
**Confidence**: ${(issue.confidence * 100).toFixed(0)}%

**Action Required**:
- Review proposed changes
- Approve or reject fix
- Monitor results

**Rollback Procedure**:
- Automatic git revert available
- Checkpoints created before each fix
`).join('\n')}

## Safety Measures
- All changes require explicit approval
- Atomic commits for each fix
- Rollback procedures documented
- Test execution after each fix

## Next Steps
1. Review this plan carefully
2. Run: delobotomize -fix
3. Approve each fix individually

---
Generated: ${new Date().toISOString()}
`;
}

async function generateExecutionOrder(workfile: any[]): Promise<any> {
  return {
    total_steps: workfile.length,
    steps: workfile.map((issue, i) => ({
      step_id: i + 1,
      issue: issue.root_cause,
      priority: issue.priority,
      requires_approval: true,
      has_rollback: true
    }))
  };
}
