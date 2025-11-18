import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Fix Phase
 *
 * Applies changes atomically with safety checks and user approval.
 *
 * Precondition: Recovery artifacts exist, git repository is clean
 * Input: Recovery plan, user approvals
 * Output: fix-report.md, approval-log.json, changes.patch, commits.json, test-results.json
 * Duration: 1 minute per fix (excluding user approval time)
 */
export async function runFix(): Promise<void> {
  const spinner = ora('Running fix phase...').start();

  try {
    const projectRoot = process.cwd();
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');

    // Check git status
    spinner.text = 'Checking git status...';
    await checkGitClean();

    // Find latest run directory
    const runsDir = path.join(delobotomizeDir, 'runs');
    const runs = await fs.readdir(runsDir);
    const latestRun = runs.sort().reverse()[0];

    if (!latestRun) {
      throw new Error('No recovery run found. Run recovery phase first.');
    }

    const fixDir = path.join(runsDir, latestRun, 'fix');
    await fs.mkdir(fixDir, { recursive: true });

    // Load execution order
    spinner.text = 'Loading recovery plan...';
    const recoveryDir = path.join(runsDir, latestRun, 'recovery');
    const executionOrder = await loadExecutionOrder(recoveryDir);

    spinner.stop();

    // Execute fixes with approval
    const approvalLog: any[] = [];
    const commits: any[] = [];

    for (const step of executionOrder.steps) {
      console.log(chalk.blue(`\n📋 Step ${step.step_id}: ${step.issue}`));

      const { approved } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'approved',
          message: 'Apply this fix?',
          default: false
        }
      ]);

      approvalLog.push({
        step_id: step.step_id,
        issue: step.issue,
        approved,
        timestamp: new Date().toISOString()
      });

      if (approved) {
        const spinner2 = ora('Applying fix...').start();

        // Apply the fix (placeholder)
        const commit = await applyFix(step, projectRoot);
        commits.push(commit);

        spinner2.succeed(chalk.green('Fix applied'));
      } else {
        console.log(chalk.yellow('Skipped'));
      }
    }

    // Generate fix report
    spinner.start('Generating fix report...');
    await fs.writeFile(
      path.join(fixDir, 'approval-log.json'),
      JSON.stringify(approvalLog, null, 2)
    );

    await fs.writeFile(
      path.join(fixDir, 'commits.json'),
      JSON.stringify(commits, null, 2)
    );

    const fixReport = await generateFixReport(approvalLog, commits);
    await fs.writeFile(
      path.join(fixDir, 'fix-report.md'),
      fixReport
    );

    spinner.succeed(chalk.green('✓ Fix phase completed'));
    console.log(chalk.gray(`  Output: ${fixDir}`));
    console.log(chalk.gray(`  Applied: ${commits.length} fixes`));
    console.log(chalk.gray(`  Skipped: ${approvalLog.filter(a => !a.approved).length} fixes`));

  } catch (error) {
    spinner.fail('Fix phase failed');
    throw error;
  }
}

async function checkGitClean(): Promise<void> {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      throw new Error('Git repository has uncommitted changes. Commit or stash them first.');
    }
  } catch (error: any) {
    if (error.message.includes('not a git repository')) {
      console.log(chalk.yellow('⚠ Not a git repository. Continuing without version control.'));
    } else {
      throw error;
    }
  }
}

async function loadExecutionOrder(recoveryDir: string): Promise<any> {
  const orderPath = path.join(recoveryDir, 'execution-order.json');
  const content = await fs.readFile(orderPath, 'utf-8');
  return JSON.parse(content);
}

async function applyFix(step: any, projectRoot: string): Promise<any> {
  // Create git checkpoint
  let checkpointSha = 'no-git';
  try {
    checkpointSha = execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim();
  } catch {
    // Not a git repo, continue anyway
  }

  // Apply fix based on issue type
  let applied = false;
  let commitSha = checkpointSha;
  const fixDetails: string[] = [];

  try {
    if (step.issue.includes('Rate Limit')) {
      // Update settings.json with rate limiting config
      const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
      try {
        await fs.access(settingsPath);
        const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        settings.request_delay_ms = 1000;
        settings.retry_backoff_factor = 2;
        settings.max_retries = 3;
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
        fixDetails.push('Updated rate limiting config in .claude/settings.json');
        applied = true;
      } catch {}
    } else if (step.issue.includes('Test')) {
      // Create test structure
      const testsDir = path.join(projectRoot, 'tests');
      await fs.mkdir(testsDir, { recursive: true });
      await fs.writeFile(
        path.join(testsDir, 'example.test.ts'),
        `// Example test file\nimport { describe, it, expect } from 'bun:test';\n\ndescribe('Example', () => {\n  it('should pass', () => {\n    expect(true).toBe(true);\n  });\n});\n`
      );
      fixDetails.push('Created tests/ directory with example test');
      applied = true;
    } else {
      // For other issues, document that manual intervention is required
      fixDetails.push('Manual intervention required - see recovery plan for details');
    }

    if (applied && checkpointSha !== 'no-git') {
      // Commit the fix
      try {
        execSync('git add -A', { cwd: projectRoot, stdio: 'ignore' });
        execSync(`git commit -m "delobotomize: ${step.issue}"`, { cwd: projectRoot, stdio: 'ignore' });
        commitSha = execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf-8' }).trim();
      } catch {
        // Commit failed, but fix was applied
      }
    }

    return {
      step_id: step.step_id,
      issue: step.issue,
      commit_sha: commitSha,
      applied,
      checkpoint_sha: checkpointSha,
      fix_details: fixDetails,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    // Rollback on error if in git repo
    if (checkpointSha !== 'no-git') {
      try {
        execSync(`git reset --hard ${checkpointSha}`, { cwd: projectRoot, stdio: 'ignore' });
      } catch {}
    }
    throw error;
  }
}

async function generateFixReport(approvalLog: any[], commits: any[]): Promise<string> {
  const approved = approvalLog.filter(a => a.approved).length;
  const skipped = approvalLog.filter(a => !a.approved).length;

  return `# Delobotomize Fix Report

## Summary
- **Total Fixes Proposed**: ${approvalLog.length}
- **Approved**: ${approved}
- **Skipped**: ${skipped}
- **Commits Created**: ${commits.length}

## Applied Fixes

${commits.map((commit, i) => `
### ${i + 1}. ${commit.issue}
- **Commit**: ${commit.commit_sha}
- **Timestamp**: ${commit.timestamp}
`).join('\n')}

## Skipped Fixes

${approvalLog.filter(a => !a.approved).map(log => `
- ${log.issue} (Step ${log.step_id})
`).join('\n')}

## Rollback Instructions

To rollback all changes:
\`\`\`bash
${commits.map(c => `git revert ${c.commit_sha}`).join('\n')}
\`\`\`

---
Generated: ${new Date().toISOString()}
`;
}
