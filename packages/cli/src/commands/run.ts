import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const runCommand = new Command('run')
  .description('Start integrated proxy and monitoring, run phases')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--phase <phase>', 'Run specific phase')
  .option('--stall-timeout <seconds>', 'Stall detection timeout', '60')
  .option('--leave-services-running', 'Keep services running after completion')
  .action(async (options) => {
    const spinner = ora('Starting Delobotomize run...').start();

    try {
      // TODO: Implement integrated run lifecycle
      spinner.text = 'Verifying claude docs integrity...';

      spinner.text = 'Starting monitoring services...';

      spinner.text = 'Running phases...';

      spinner.succeed(chalk.green('Run completed successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Run failed'));
      console.error(error);
      process.exit(1);
    }
  });
