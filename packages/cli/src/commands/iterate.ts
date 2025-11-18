import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const iterateCommand = new Command('iterate')
  .description('Emit summary to external API (stub in v1)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Running iterate phase...').start();

    try {
      // TODO: Implement iterate stub (v1 limited)
      spinner.text = 'Collecting run summary...';
      spinner.text = 'Recording local notes...';

      spinner.warn(chalk.yellow('Iterate phase (stub): External API not implemented'));
      spinner.succeed(chalk.green('Iterate phase completed'));
    } catch (error) {
      spinner.fail(chalk.red('Iterate phase failed'));
      console.error(error);
      process.exit(1);
    }
  });
