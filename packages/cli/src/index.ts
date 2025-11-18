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

const program = new Command();

program
  .name('delobotomize')
  .description('Claude Code monitoring and recovery toolchain')
  .version('1.0.0');

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

program.parse();
