import { Command } from 'commander';
import chalk from 'chalk';

export const listRunsCommand = new Command('list-runs')
  .description('List all run identifiers with status and timestamps')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    try {
      // TODO: Implement list-runs using RunService
      console.log(chalk.blue('Recent runs:'));
      console.log(chalk.dim('No runs found'));
    } catch (error) {
      console.error(chalk.red('Failed to list runs'));
      console.error(error);
      process.exit(1);
    }
  });
