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
  const criticalHighIssues = workfile.filter(i => i.priority === 'critical' || i.priority === 'high');

  return `# Delobotomize Recovery Plan

## Overview
This recovery plan addresses **${workfile.length} identified issues** with **${criticalHighIssues.length}** requiring immediate attention.

### Risk Assessment
- **High-Priority Fixes**: ${criticalHighIssues.length}
- **Automated Fixes**: ${workfile.filter(i => i.id === 'rate_limit_pattern' || i.id === 'missing_tests').length}
- **Manual Intervention Required**: ${workfile.filter(i => i.id === 'session_stalls' || i.id === 'context_saturation').length}

## Recovery Steps

${workfile.map((issue, i) => `
### Step ${i + 1}: ${issue.root_cause} [${issue.priority.toUpperCase()}]
**Issue ID**: ${issue.id}
**Confidence**: ${(issue.confidence * 100).toFixed(0)}%
**Estimated Time**: ${estimateFixTime(issue)} minutes

#### Problem Statement
${issue.description}

#### Root Causes
${issue.contributing_factors ? issue.contributing_factors.map((f: string) => `- ${f}`).join('\n') : 'N/A'}

#### Proposed Solution
${issue.suggested_fix}

#### Execution Steps
${generateExecutionSteps(issue)}

#### Rollback Procedure
1. Create git checkpoint before applying fix
2. Document current state
3. Apply fix atomically
4. Verify results
5. If issues occur: \`git revert <commit-sha>\`

#### Success Criteria
${generateSuccessCriteria(issue)}

---
`).join('\n')}

## Safety Measures
- ✅ All changes require explicit human approval
- ✅ Atomic git commits for each fix (rollback-safe)
- ✅ Pre-fix checksums and backups
- ✅ Automated rollback on failure
- ✅ Dry-run mode available

## Execution Order
Fixes will be applied in priority order:
${workfile.map((issue, i) => `${i + 1}. [${issue.priority.toUpperCase()}] ${issue.root_cause}`).join('\n')}

## Next Steps
1. **Review** this recovery plan thoroughly
2. **Backup** your project (\`git commit -am "Pre-recovery checkpoint"\`)
3. **Execute**: Run \`delobotomize -fix\`
4. **Approve** each fix individually when prompted
5. **Verify** changes after each fix
6. **Rollback** if any issues arise

## Emergency Rollback
If anything goes wrong:
\`\`\`bash
# View recent commits
git log --oneline -10

# Revert last fix
git revert HEAD

# Revert all fixes (replace SHA with pre-recovery commit)
git reset --hard <pre-recovery-sha>
\`\`\`

---
Generated: ${new Date().toISOString()}
Delobotomize v15.0
`;
}

function estimateFixTime(issue: any): number {
  const timeMap: any = {
    'rate_limit_pattern': 2,
    'context_saturation': 10,
    'session_stalls': 15,
    'reasoning_overflow': 5,
    'error_patterns': 10,
    'missing_tests': 30,
    'large_files': 20
  };
  return timeMap[issue.id] || 5;
}

function generateExecutionSteps(issue: any): string {
  const stepsMap: any = {
    'rate_limit_pattern': `1. Update .claude/settings.json with rate limiting config
2. Add retry logic with exponential backoff
3. Reduce request frequency
4. Test with sample requests`,

    'context_saturation': `1. Identify largest files in context
2. Split files over 1MB into modules
3. Add .claudeignore for generated files
4. Clear conversation history
5. Verify context usage drops below 70%`,

    'session_stalls': `1. Review stall timestamps
2. Identify long-running operations
3. Break tasks into smaller chunks
4. Add timeouts and progress indicators
5. Monitor for reduced stall frequency`,

    'missing_tests': `1. Create tests/ directory
2. Add test framework (bun test, jest, vitest)
3. Create initial test files
4. Run tests to verify setup`,

    'large_files': `1. Identify files >1MB
2. Extract reusable modules
3. Split into logical components
4. Update imports
5. Verify functionality`
  };

  return stepsMap[issue.id] || `1. Review issue details\n2. Apply suggested fix\n3. Verify resolution\n4. Monitor for recurrence`;
}

function generateSuccessCriteria(issue: any): string {
  const criteriaMap: any = {
    'rate_limit_pattern': '- Rate limit events reduced by 80%+\n- No retry loops detected\n- Request frequency stabilized',
    'context_saturation': '- Context usage stays below 70%\n- No saturation warnings\n- Files properly modularized',
    'session_stalls': '- Stall frequency reduced by 50%+\n- Average stall duration <2 minutes\n- Progress indicators functional',
    'missing_tests': '- Test directory created\n- Tests executable\n- Example tests passing',
    'large_files': '- No files >1MB\n- Modular structure achieved\n- All imports working'
  };

  return criteriaMap[issue.id] || '- Issue no longer appears in audit\n- Root cause addressed\n- Monitoring shows improvement';
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
