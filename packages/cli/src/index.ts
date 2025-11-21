#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { testCommand } from './commands/test.js';
import { checkCommand } from './commands/check.js';
import { runCommand } from './commands/run.js';
import { auditCommand } from './commands/audit.js';
import { analysisCommand } from './commands/analysis.js';
import { recoveryCommand } from './commands/recovery.js';
import { fixCommand } from './commands/fix.js';
import { iterateCommand } from './commands/iterate.js';
import { listRunsCommand } from './commands/list-runs.js';
import { statusCommand } from './commands/status.js';
import { rollbackCommand } from './commands/rollback.js';
import { cleanCommand } from './commands/clean.js';
import { spawn } from 'child_process';
import chalk from 'chalk';

const program = new Command();

program
  .name('delobotomize')
  .description('Claude Code monitoring and recovery toolchain')
  .version('1.0.0')
  .usage('[path] [options]\n       delobotomize <command> [options]')
  .argument('[path]', 'Project path to monitor (runs "delobotomize run" by default)')
  .option('--no-frontend', 'Do not start the dashboard frontend')
  .option('--no-backend', 'Do not start the backend API server')
  .option('--phase <phase>', 'Run specific phase only')
  .option('--stall-timeout <seconds>', 'Stall detection timeout')
  .option('--leave-services-running', 'Keep services running after completion')
  .action(async (path, options) => {
    // If a path is provided, default to running the monitoring
    if (path) {
      // Execute run command with the provided path
      const runArgs = ['run', '--path', path];

      if (!options.frontend) runArgs.push('--no-frontend');
      if (!options.backend) runArgs.push('--no-backend');
      if (options.phase) runArgs.push('--phase', options.phase);
      if (options.stallTimeout) runArgs.push('--stall-timeout', options.stallTimeout);
      if (options.leaveServicesRunning) runArgs.push('--leave-services-running');

      // Re-invoke with run command
      const proc = spawn(process.argv[0], [process.argv[1], ...runArgs], {
        stdio: 'inherit'
      });

      proc.on('exit', (code) => {
        process.exit(code || 0);
      });
      return;
    }
  });

// Register all commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(testCommand);
program.addCommand(checkCommand);
program.addCommand(runCommand);
program.addCommand(auditCommand);
program.addCommand(analysisCommand);
program.addCommand(recoveryCommand);
program.addCommand(fixCommand);
program.addCommand(iterateCommand);
program.addCommand(listRunsCommand);
program.addCommand(statusCommand);
program.addCommand(rollbackCommand);
program.addCommand(cleanCommand);

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.outputHelp();
  console.log('\n' + chalk.bold('Examples:'));
  console.log('  $ delobotomize /path/to/project          # Run monitoring on project');
  console.log('  $ delobotomize ./myapp --no-frontend     # Run without dashboard');
  console.log('  $ delobotomize init                      # Initialize current directory');
  console.log('  $ delobotomize status                    # Show current status');
  console.log('\n' + chalk.dim('For more information on a specific command:'));
  console.log('  $ delobotomize <command> --help');
  process.exit(0);
}

program.parse();
