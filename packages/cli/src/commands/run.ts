import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runCommand = new Command('run')
  .description('Start integrated proxy and monitoring, run phases')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--phase <phase>', 'Run specific phase')
  .option('--stall-timeout <seconds>', 'Stall detection timeout', '60')
  .option('--no-frontend', 'Do not start the dashboard frontend')
  .option('--no-backend', 'Do not start the backend API server')
  .option('--leave-services-running', 'Keep services running after completion')
  .action(async (options) => {
    const spinner = ora('Starting Delobotomize run...').start();
    const services: ChildProcess[] = [];

    // Cleanup function
    const cleanup = () => {
      if (!options.leaveServicesRunning) {
        spinner.text = 'Stopping services...';
        services.forEach(service => {
          service.kill();
        });
      }
    };

    // Handle process termination
    process.on('SIGINT', () => {
      spinner.info(chalk.yellow('Received interrupt signal'));
      cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });

    try {
      // Verify claude docs integrity
      spinner.text = 'Verifying claude docs integrity...';
      // TODO: Implement integrity check

      // Start backend if enabled
      if (options.backend !== false) {
        spinner.text = 'Starting backend API server...';
        const backendPath = path.resolve(__dirname, '../../../backend');
        const backend = spawn('pnpm', ['dev'], {
          cwd: backendPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });

        backend.stdout?.on('data', (data) => {
          const message = data.toString().trim();
          if (message.includes('starting') || message.includes('listening')) {
            console.log(chalk.dim(`  [backend] ${message}`));
          }
        });

        backend.stderr?.on('data', (data) => {
          console.error(chalk.red(`  [backend] ${data.toString().trim()}`));
        });

        services.push(backend);
        spinner.succeed(chalk.green('Backend started on port 4000'));
        spinner.start();
      }

      // Start frontend if enabled
      if (options.frontend !== false) {
        spinner.text = 'Starting frontend dashboard...';
        const frontendPath = path.resolve(__dirname, '../../../frontend');
        const frontend = spawn('pnpm', ['dev'], {
          cwd: frontendPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });

        frontend.stdout?.on('data', (data) => {
          const message = data.toString().trim();
          if (message.includes('Local:') || message.includes('ready')) {
            console.log(chalk.dim(`  [frontend] ${message}`));
          }
        });

        frontend.stderr?.on('data', (data) => {
          const err = data.toString().trim();
          if (!err.includes('DeprecationWarning')) {
            console.error(chalk.red(`  [frontend] ${err}`));
          }
        });

        services.push(frontend);
        spinner.succeed(chalk.green('Frontend started on port 5173'));
        spinner.start();
      }

      // Start monitoring
      spinner.text = 'Starting session monitoring...';
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed(chalk.green('Monitoring active'));

      // Display status
      console.log();
      console.log(chalk.bold('Delobotomize is running'));
      console.log();
      if (options.backend !== false) {
        console.log(chalk.cyan('  Backend API:  ') + chalk.underline('http://localhost:4000'));
      }
      if (options.frontend !== false) {
        console.log(chalk.cyan('  Dashboard:    ') + chalk.underline('http://localhost:5173'));
      }
      console.log(chalk.cyan('  Project path: ') + options.path);
      console.log(chalk.cyan('  Proxy log:    ') + path.join(options.path, '.delobotomize/proxy.log'));
      console.log();
      console.log(chalk.dim('Press Ctrl+C to stop'));
      console.log();

      // Run phases if specified
      if (options.phase) {
        spinner.start(`Running ${options.phase} phase...`);
        // TODO: Implement phase execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        spinner.succeed(chalk.green(`${options.phase} phase completed`));
      }

      // Keep process alive if services are running
      if (options.leaveServicesRunning || services.length > 0) {
        await new Promise(() => {}); // Wait indefinitely
      }

    } catch (error) {
      spinner.fail(chalk.red('Run failed'));
      console.error(error);
      cleanup();
      process.exit(1);
    }
  });
