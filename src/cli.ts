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
    console.log(chalk.blue('🚀 Starting Delobotomize stack...'));
    console.log(chalk.yellow('⚠ Stack management not yet implemented'));
  });

stack
  .command('stop')
  .description('Stop all components')
  .action(async () => {
    console.log(chalk.blue('🛑 Stopping Delobotomize stack...'));
    console.log(chalk.yellow('⚠ Stack management not yet implemented'));
  });

stack
  .command('status')
  .description('Show running processes and ports')
  .action(async () => {
    console.log(chalk.blue('📊 Stack status:'));
    console.log(chalk.yellow('⚠ Stack management not yet implemented'));
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
    console.log(chalk.yellow('⚠ Clean command not yet implemented'));
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
    console.log(chalk.yellow('⚠ Dashboard not yet implemented'));
  });

dashboard
  .command('svelte')
  .description('Start Svelte dashboard (port 5174)')
  .action(async () => {
    console.log(chalk.blue('🎨 Starting Svelte dashboard...'));
    console.log(chalk.yellow('⚠ Dashboard not yet implemented'));
  });

dashboard
  .command('both')
  .description('Start both dashboards')
  .action(async () => {
    console.log(chalk.blue('🎨 Starting both dashboards...'));
    console.log(chalk.yellow('⚠ Dashboard not yet implemented'));
  });

program.parse();
