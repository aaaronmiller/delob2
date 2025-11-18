#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Monitor Server Manager
 *
 * Starts and manages the vendored multi-agent-workflow monitoring server
 */

let monitoringServer: ChildProcess | null = null;
let vueServer: ChildProcess | null = null;

function startMonitoringServer(): void {
  const serverPath = path.resolve(__dirname, '../integrations/multi-agent-workflow/apps/server');

  // Check if vendored server exists
  if (!fs.existsSync(serverPath)) {
    console.log(chalk.yellow('⚠ Multi-agent-workflow not vendored yet'));
    console.log(chalk.gray('The monitoring server would start at http://localhost:4000'));
    console.log(chalk.gray('Run this after vendoring: bun run dev --cwd ' + serverPath));
    return;
  }

  console.log(chalk.blue('🚀 Starting monitoring server...'));

  monitoringServer = spawn('bun', ['run', 'dev'], {
    cwd: serverPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '4000'
    }
  });

  monitoringServer.on('error', (error) => {
    console.error(chalk.red('Failed to start monitoring server:'), error);
  });

  monitoringServer.on('exit', (code) => {
    if (code !== 0) {
      console.log(chalk.yellow(`Monitoring server exited with code ${code}`));
    }
  });

  console.log(chalk.green('✓ Monitoring server started on http://localhost:4000'));
}

function startVueDashboard(): void {
  const clientPath = path.resolve(__dirname, '../integrations/multi-agent-workflow/apps/client');

  // Check if vendored client exists
  if (!fs.existsSync(clientPath)) {
    console.log(chalk.yellow('⚠ Vue dashboard not vendored yet'));
    console.log(chalk.gray('The dashboard would start at http://localhost:5173'));
    return;
  }

  console.log(chalk.blue('🎨 Starting Vue dashboard...'));

  vueServer = spawn('bun', ['run', 'dev'], {
    cwd: clientPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '5173'
    }
  });

  vueServer.on('error', (error) => {
    console.error(chalk.red('Failed to start Vue dashboard:'), error);
  });

  vueServer.on('exit', (code) => {
    if (code !== 0) {
      console.log(chalk.yellow(`Vue dashboard exited with code ${code}`));
    }
  });

  console.log(chalk.green('✓ Vue dashboard started on http://localhost:5173'));
}

function stopServers(): void {
  if (monitoringServer) {
    monitoringServer.kill();
    console.log(chalk.gray('Stopped monitoring server'));
  }

  if (vueServer) {
    vueServer.kill();
    console.log(chalk.gray('Stopped Vue dashboard'));
  }
}

// Handle process exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nShutting down...'));
  stopServers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopServers();
  process.exit(0);
});

// Main execution
console.log(chalk.blue.bold('Delobotomize Monitoring Server v15.0\n'));

startMonitoringServer();
startVueDashboard();

console.log(chalk.gray('\nPress Ctrl+C to stop\n'));

// Keep process alive
process.stdin.resume();
