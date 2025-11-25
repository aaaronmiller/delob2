#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Monitor Server Manager
 *
 * Starts our monitoring server (inspired by multi-agent-workflow by Apolo Pena)
 */

let monitoringServer: ChildProcess | null = null;

function startMonitoringServer(): void {
  const serverPath = path.resolve(__dirname, '../monitoring/server/index.ts');

  console.log(chalk.blue('🚀 Starting Delobotomize monitoring server...'));
  console.log(chalk.gray('   Inspired by multi-agent-workflow by Apolo Pena\n'));

  monitoringServer = spawn('bun', ['run', serverPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '4000',
      DB_PATH: '.delobotomize/monitoring.db'
    }
  });

  monitoringServer.on('error', (error) => {
    console.error(chalk.red('Failed to start monitoring server:'), error);
    process.exit(1);
  });

  monitoringServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(chalk.yellow(`\nMonitoring server exited with code ${code}`));
    }
  });
}

function stopServer(): void {
  if (monitoringServer) {
    monitoringServer.kill();
    console.log(chalk.gray('Stopped monitoring server'));
  }
}

// Handle process exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nShutting down...'));
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});

// Main execution
console.log(chalk.blue.bold('Delobotomize Monitoring v15.0\n'));

startMonitoringServer();

console.log(chalk.gray('\nPress Ctrl+C to stop\n'));

// Keep process alive
process.stdin.resume();
