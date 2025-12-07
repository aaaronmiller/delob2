#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initProject } from './init.js';
import { runAudit } from './phases/audit.js';
import { runAnalysis } from './phases/analysis.js';
import { runRecovery } from './phases/recovery.js';
import { runFix } from './phases/fix.js';
import { runIterate } from './phases/iterate.js';
import { checkIntegrity } from './integrity.js';
import { loadConfig } from './config.js';
import { LogReader } from './bridge/log-reader.js';
import { Parser } from './bridge/parser.js';
import { Transformer } from './bridge/transformer.js';
import { Relayer } from './bridge/relayer.js';
import path from 'path';

const program = new Command();

program
  .name('delobotomize')
  .description('Claude Code recovery pipeline - rescues context-collapsed AI coding sessions')
  .version('15.0.0');

// CORE PIPELINE COMMANDS
program
  .command('run')
  .description('Execute full 5-phase pipeline')
  .action(async () => {
    try {
      console.log(chalk.blue('🔄 Starting Delobotomize 5-phase pipeline...\n'));

      // Check integrity first
      await checkIntegrity();

      // Run all phases in sequence
      await runAudit();
      await runAnalysis();
      await runRecovery();
      await runFix();
      await runIterate();

      console.log(chalk.green('\n✓ Pipeline completed successfully!'));
    } catch (error) {
      console.error(chalk.red('✗ Pipeline failed:'), error);
      process.exit(1);
    }
  });

program
  .command('audit')
  .alias('-audit')
  .description('Execute audit phase only')
  .action(async () => {
    try {
      await checkIntegrity();
      await runAudit();
    } catch (error) {
      console.error(chalk.red('✗ Audit failed:'), error);
      process.exit(1);
    }
  });

program
  .command('analysis')
  .alias('-analysis')
  .description('Execute analysis phase only')
  .action(async () => {
    try {
      await runAnalysis();
    } catch (error) {
      console.error(chalk.red('✗ Analysis failed:'), error);
      process.exit(1);
    }
  });

program
  .command('recovery')
  .alias('-recovery')
  .description('Execute recovery phase only')
  .action(async () => {
    try {
      await runRecovery();
    } catch (error) {
      console.error(chalk.red('✗ Recovery failed:'), error);
      process.exit(1);
    }
  });

program
  .command('fix')
  .alias('-fix')
  .description('Execute fix phase only (requires approval)')
  .action(async () => {
    try {
      await runFix();
    } catch (error) {
      console.error(chalk.red('✗ Fix failed:'), error);
      process.exit(1);
    }
  });

program
  .command('iterate')
  .alias('-iterate')
  .description('Execute iterate phase only')
  .action(async () => {
    try {
      await runIterate();
    } catch (error) {
      console.error(chalk.red('✗ Iterate failed:'), error);
      process.exit(1);
    }
  });

// STACK MANAGEMENT COMMANDS
const stack = program
  .command('stack')
  .description('Manage full stack (proxy + monitoring + bridge + dashboards)');

stack
  .command('start')
  .description('Start all components')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting Delobotomize stack...\n'));

    try {
      const config = await loadConfig();
      const projectRoot = process.cwd();
      const proxyLogPath = path.join(projectRoot, '.delobotomize', 'proxy.log');

      // Start hook bridge
      console.log(chalk.gray('Starting hook bridge...'));
      const reader = new LogReader(proxyLogPath);
      const parser = new Parser();
      const transformer = new Transformer(path.basename(projectRoot), {
        contextWindow: 200000,
        reasoningBudget: config.claude_code_proxy.reasoning.budget
      });
      const relayer = new Relayer(config.multi_agent_workflow.hooks.server_url);

      // Check if monitoring server is available
      const serverAvailable = await relayer.ping();
      if (serverAvailable) {
        console.log(chalk.green('✓ Monitoring server detected at ' + config.multi_agent_workflow.hooks.server_url));
      } else {
        console.log(chalk.yellow('⚠ Monitoring server not reachable'));
        console.log(chalk.gray('  Start it with: delobotomize-monitor'));
      }

      // Set up event processing pipeline
      reader.on('line', async (line) => {
        try {
          const entry = parser.parse(line);
          const event = transformer.transform(entry);
          await relayer.send(event);
        } catch (error: any) {
          // Silently skip malformed lines
          if (error.message && !error.message.includes('Invalid TSV format')) {
            console.error(chalk.red('Bridge error:'), error.message);
          }
        }
      });

      await reader.start();
      console.log(chalk.green('✓ Hook bridge active'));
      console.log(chalk.gray('  Watching: ' + proxyLogPath));
      console.log(chalk.gray('  Relaying to: ' + config.multi_agent_workflow.hooks.server_url));

      console.log(chalk.gray('\nPress Ctrl+C to stop'));

      // Keep process alive
      process.stdin.resume();

    } catch (error: any) {
      console.error(chalk.red('✗ Failed to start stack:'), error.message);
      process.exit(1);
    }
  });

stack
  .command('stop')
  .description('Stop all components')
  .action(async () => {
    console.log(chalk.blue('🛑 Stopping Delobotomize stack...'));
    try {
      const { execSync } = await import('child_process');

      // Stop Proxy
      try {
        execSync('pkill -f "proxy/server.py"', { stdio: 'ignore' });
        console.log(chalk.green('✓ Proxy stopped'));
      } catch {
        console.log(chalk.gray('  Proxy not running'));
      }

      // Stop Monitoring Server
      try {
        execSync('pkill -f "monitoring/server/index.ts"', { stdio: 'ignore' });
        console.log(chalk.green('✓ Monitoring server stopped'));
      } catch {
        console.log(chalk.gray('  Monitoring server not running'));
      }

      console.log(chalk.green('Stack stopped.'));
    } catch (error) {
      console.error(chalk.red('Error stopping stack:'), error);
    }
  });

stack
  .command('status')
  .description('Show running processes and ports')
  .action(async () => {
    console.log(chalk.blue('📊 Stack status:'));
    try {
      const { execSync } = await import('child_process');
      const checkPort = (port: number, name: string) => {
        try {
          execSync(`lsof -i :${port}`, { stdio: 'ignore' });
          console.log(chalk.green(`✓ ${name} (Port ${port}): Running`));
          return true;
        } catch {
          console.log(chalk.red(`✗ ${name} (Port ${port}): Stopped`));
          return false;
        }
      };

      checkPort(8082, 'Proxy Server');
      checkPort(4000, 'Monitoring Server');
      checkPort(5173, 'Vue Dashboard');

    } catch (error) {
      console.error(chalk.red('Error checking status:'), error);
    }
  });

// PROJECT MANAGEMENT COMMANDS
program
  .command('init')
  .description('Initialize .claude/ and .delobotomize/ directories')
  .option('--full', 'Full initialization with all templates')
  .action(async (options) => {
    try {
      await initProject(options.full);
    } catch (error) {
      console.error(chalk.red('✗ Initialization failed:'), error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show current project status')
  .action(async () => {
    try {
      const config = await loadConfig();
      console.log(chalk.blue('📋 Delobotomize Status'));
      console.log(chalk.gray('Version:'), '15.0.0');
      console.log(chalk.gray('Config loaded:'), config ? '✓' : '✗');
    } catch (error) {
      console.error(chalk.red('✗ Status check failed:'), error);
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove old runs (keep last 10)')
  .action(async () => {
    console.log(chalk.blue('🧹 Cleaning old runs...'));
    try {
      const { cleanupOldRuns } = await import('./artifacts.js');
      await cleanupOldRuns(process.cwd(), 10);
      console.log(chalk.green('✓ Old runs cleaned'));
    } catch (error) {
      console.error(chalk.red('✗ Clean failed:'), error);
      process.exit(1);
    }
  });

program
  .command('list-runs')
  .description('List historical runs')
  .action(async () => {
    try {
      const { listRuns } = await import('./artifacts.js');
      const runs = await listRuns(process.cwd());

      if (runs.length === 0) {
        console.log(chalk.yellow('No runs found.'));
        return;
      }

      console.log(chalk.blue('📋 Historical Runs\n'));
      for (const run of runs) {
        const status = run.status === 'completed' ? chalk.green('✓') :
          run.status === 'failed' ? chalk.red('✗') : chalk.yellow('⏳');
        console.log(`${status} ${run.run_id}`);
        console.log(chalk.gray(`   Started: ${run.start_time}`));
        console.log(chalk.gray(`   Phases: ${run.phases_completed.join(', ') || 'none'}`));
        console.log();
      }
    } catch (error) {
      console.error(chalk.red('✗ List runs failed:'), error);
      process.exit(1);
    }
  });

program
  .command('rollback')
  .description('Revert to a checkpoint')
  .option('--run-id <id>', 'Run ID to rollback')
  .action(async (options) => {
    if (!options.runId) {
      console.log(chalk.red('✗ --run-id is required'));
      process.exit(1);
    }
    console.log(chalk.blue(`🔄 Rolling back to ${options.runId}...`));
    console.log(chalk.yellow('⚠ Rollback requires git history. Check commits.json in the run directory.'));
    console.log(chalk.gray('\nManual rollback:'));
    console.log(chalk.gray(`  git log --oneline -10`));
    console.log(chalk.gray(`  git revert <commit-sha>`));
  });

// PROXY COMMANDS
const proxy = program
  .command('proxy')
  .description('Control API proxy');

proxy
  .command('start')
  .description('Start proxy server')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting proxy server...'));
    try {
      const { spawn } = await import('child_process');
      const proxyPath = path.resolve(process.cwd(), 'proxy', 'server.py');

      const child = spawn('python3', [proxyPath], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          PROXY_PORT: '8082',
          PROXY_LOG_PATH: '.delobotomize/proxy.log'
        }
      });

      child.on('error', (error) => {
        console.error(chalk.red('Failed to start proxy:'), error);
        process.exit(1);
      });

    } catch (error) {
      console.error(chalk.red('✗ Proxy start failed:'), error);
      process.exit(1);
    }
  });

proxy
  .command('stop')
  .description('Stop proxy server')
  .action(async () => {
    console.log(chalk.blue('🛑 Stopping proxy server...'));
    try {
      const { execSync } = await import('child_process');
      execSync('pkill -f "proxy/server.py"', { stdio: 'ignore' });
      console.log(chalk.green('✓ Proxy stopped'));
    } catch {
      console.log(chalk.yellow('⚠ No proxy process found'));
    }
  });

// MONITORING COMMANDS
const monitoring = program
  .command('monitoring')
  .description('Control monitoring server');

monitoring
  .command('start')
  .description('Start monitoring server')
  .action(async () => {
    console.log(chalk.blue('🚀 Starting monitoring server...'));
    try {
      const { spawn } = await import('child_process');
      const serverPath = path.resolve(process.cwd(), 'monitoring', 'server', 'index.ts');

      const child = spawn('bun', ['run', serverPath], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: '4000',
          DB_PATH: '.delobotomize/monitoring.db'
        }
      });

      child.on('error', (error) => {
        console.error(chalk.red('Failed to start monitoring:'), error);
        process.exit(1);
      });

    } catch (error) {
      console.error(chalk.red('✗ Monitoring start failed:'), error);
      process.exit(1);
    }
  });

monitoring
  .command('stop')
  .description('Stop monitoring server')
  .action(async () => {
    console.log(chalk.blue('🛑 Stopping monitoring server...'));
    try {
      const { execSync } = await import('child_process');
      execSync('pkill -f "monitoring/server/index.ts"', { stdio: 'ignore' });
      console.log(chalk.green('✓ Monitoring stopped'));
    } catch {
      console.log(chalk.yellow('⚠ No monitoring process found'));
    }
  });

// DASHBOARD COMMANDS
const dashboard = program
  .command('dashboard')
  .description('Control dashboard interfaces');

dashboard
  .command('vue')
  .description('Start Vue dashboard (port 5173)')
  .action(async () => {
    console.log(chalk.blue('🎨 Starting Vue dashboard...'));
    console.log(chalk.gray('Dashboard available at monitoring server: http://localhost:4000'));
    console.log(chalk.yellow('⚠ Standalone Vue dashboard requires integrations/multi-agent-workflow/'));
  });

dashboard
  .command('svelte')
  .description('Start Svelte dashboard (port 5174)')
  .action(async () => {
    console.log(chalk.blue('🎨 Starting Svelte dashboard...'));
    console.log(chalk.yellow('⚠ Svelte dashboard requires integrations/dashboard-svelte/'));
  });

dashboard
  .command('both')
  .description('Start both dashboards')
  .action(async () => {
    console.log(chalk.blue('🎨 Starting both dashboards...'));
    console.log(chalk.yellow('⚠ Dashboard integration pending vendor setup'));
  });

program.parse();

