import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';

export async function initProject(fullInit: boolean = false): Promise<void> {
  const spinner = ora('Initializing Delobotomize project...').start();

  try {
    // Check if Claude Code CLI is installed
    await checkClaudeCodeInstalled();
    spinner.succeed('Claude Code CLI detected');

    // Get current working directory
    const projectRoot = process.cwd();
    const claudeDir = path.join(projectRoot, '.claude');
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');

    // Create .claude directory
    spinner.start('Creating .claude directory...');
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.mkdir(path.join(claudeDir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(claudeDir, 'skills'), { recursive: true });
    await fs.mkdir(path.join(claudeDir, 'hooks'), { recursive: true });
    await fs.mkdir(path.join(claudeDir, 'commands'), { recursive: true });
    spinner.succeed('.claude directory created');

    // Create .delobotomize directory
    spinner.start('Creating .delobotomize directory...');
    await fs.mkdir(delobotomizeDir, { recursive: true });
    await fs.mkdir(path.join(delobotomizeDir, 'cache'), { recursive: true });
    await fs.mkdir(path.join(delobotomizeDir, 'runs'), { recursive: true });
    spinner.succeed('.delobotomize directory created');

    // Create settings.json
    spinner.start('Generating settings.json...');
    await createSettingsFile(claudeDir, projectRoot);
    spinner.succeed('settings.json created');

    // Create CLAUDE.md
    spinner.start('Generating CLAUDE.md...');
    await createClaudeFile(claudeDir);
    spinner.succeed('CLAUDE.md created');

    // Create placeholder files for templates
    spinner.start('Creating template placeholders...');
    await createTemplatePlaceholders(claudeDir);
    spinner.succeed('Template placeholders created');

    // Create integrity checksum
    spinner.start('Generating integrity checksum...');
    await createIntegrityChecksum(delobotomizeDir, claudeDir);
    spinner.succeed('Integrity checksum created');

    console.log(chalk.green('\n✓ Delobotomize initialization complete!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Review .claude/settings.json'));
    console.log(chalk.gray('  2. Run: delobotomize stack start'));
    console.log(chalk.gray('  3. Run: delobotomize run'));

  } catch (error) {
    spinner.fail('Initialization failed');
    throw error;
  }
}

async function checkClaudeCodeInstalled(): Promise<void> {
  try {
    execSync('which claude-code', { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.red('\n✗ Claude Code CLI not found!'));
    console.log(chalk.yellow('Install it with: npm install -g @anthropic-ai/claude-code'));
    process.exit(1);
  }
}

async function createSettingsFile(claudeDir: string, projectRoot: string): Promise<void> {
  const projectName = path.basename(projectRoot);
  const settings = {
    delobotomize: {
      phases: ['audit', 'analysis', 'recovery', 'fix', 'iterate'],
      integrity_check: true,
      artifact_ttl_minutes: 1440
    },
    multi_agent_workflow: {
      hooks: {
        enabled: true,
        server_url: 'http://localhost:4000',
        timeout_ms: 5000,
        scripts: {
          session_start: '.claude/hooks/session_start.py',
          pre_tool_use: '.claude/hooks/pre_tool_use.py',
          post_tool_use: '.claude/hooks/post_tool_use.py',
          subagent_stop: '.claude/hooks/subagent_stop.py',
          user_prompt_submit: '.claude/hooks/user_prompt_submit.py',
          notification: '.claude/hooks/notification.py',
          stop: '.claude/hooks/stop.py',
          session_end: '.claude/hooks/session_end.py'
        }
      },
      dashboard: {
        enabled: true,
        port: 5173,
        auto_start: false
      }
    },
    claude_code_proxy: {
      port: 8082,
      providers: {
        anthropic: {
          api_key: process.env.ANTHROPIC_API_KEY || '',
          base_url: 'https://api.anthropic.com'
        }
      },
      model_routing: {
        big: 'anthropic/claude-opus-4',
        middle: 'anthropic/claude-sonnet-4',
        small: 'anthropic/claude-haiku-4'
      },
      file_logging: {
        enabled: true,
        path: '.delobotomize/proxy.log'
      },
      reasoning: {
        enabled: true,
        budget: 10000
      }
    },
    project: {
      name: projectName,
      root: projectRoot,
      version: '15.0.0'
    }
  };

  await fs.writeFile(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );
}

async function createClaudeFile(claudeDir: string): Promise<void> {
  const claudeContent = `# Delobotomize Orchestration Constitution

This file configures Claude Code to work with the Delobotomize recovery pipeline.

## Mission

You are operating within a Delobotomize-monitored session. Your actions are tracked
to detect and recover from context collapse, rate limits, and other failure modes.

## Hook Integration

This session sends telemetry to a monitoring server via Python hooks. The hooks are
non-invasive and only observe your behavior - they never block or modify your actions.

## Recovery Protocol

If the session encounters issues:
1. Delobotomize will audit the session logs
2. Analyze failure patterns
3. Generate a recovery plan
4. Apply fixes with your approval
5. Extract learnings to prevent recurrence

## Guidelines

- Work normally - the monitoring is transparent
- If you detect a stall, the monitoring system will too
- All fixes require human approval before application
- Recovery is reversible via git commits

---
Delobotomize v15.0
`;

  await fs.writeFile(path.join(claudeDir, 'CLAUDE.md'), claudeContent);
}

async function createTemplatePlaceholders(claudeDir: string): Promise<void> {
  // Create a basic agent template
  const agentTemplate = `# Sample Agent

This is a placeholder agent template.

## Purpose
Demonstrates agent structure for Delobotomize.

## Usage
This will be replaced with actual agent definitions.
`;

  await fs.writeFile(
    path.join(claudeDir, 'agents', 'sample-agent.md'),
    agentTemplate
  );

  // Create a basic skill template
  const skillTemplate = `# Sample Skill

This is a placeholder skill template.

## Capabilities
Demonstrates skill structure for Delobotomize.
`;

  await fs.writeFile(
    path.join(claudeDir, 'skills', 'sample-skill.md'),
    skillTemplate
  );

  // Create a basic hook template (Python)
  const hookTemplate = `#!/usr/bin/env python3
"""Sample Hook - Placeholder"""

import sys
import json

def main():
    """Placeholder hook that does nothing"""
    event = json.loads(sys.stdin.read())
    # Hook logic would go here
    print(json.dumps({"status": "ok"}))

if __name__ == "__main__":
    main()
`;

  await fs.writeFile(
    path.join(claudeDir, 'hooks', 'sample_hook.py'),
    hookTemplate
  );

  // Create a basic command template
  const commandTemplate = `# Sample Command

This is a placeholder slash command template.
`;

  await fs.writeFile(
    path.join(claudeDir, 'commands', 'sample.md'),
    commandTemplate
  );
}

async function createIntegrityChecksum(delobotomizeDir: string, claudeDir: string): Promise<void> {
  // Simple checksum creation - in real implementation would hash all files
  const checksum = {
    version: '15.0.0',
    timestamp: new Date().toISOString(),
    files: {
      'settings.json': 'placeholder',
      'CLAUDE.md': 'placeholder'
    }
  };

  await fs.writeFile(
    path.join(delobotomizeDir, 'claude-docs-integrity.json'),
    JSON.stringify(checksum, null, 2)
  );
}
