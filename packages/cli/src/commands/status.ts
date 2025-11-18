import { Command } from 'commander';
import chalk from 'chalk';

export const statusCommand = new Command('status')
  .description('Show current phase, alerts, and artifact locations')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    try {
      // TODO: Implement status display
      console.log(chalk.blue('Delobotomize Status:'));
      console.log(chalk.dim('  Current phase: None'));
      console.log(chalk.dim('  Active alerts: 0'));
      console.log(chalk.dim('  Artifacts: .delobotomize/runs/'));
    } catch (error) {
      console.error(chalk.red('Failed to get status'));
      console.error(error);
      process.exit(1);
    }
  });
