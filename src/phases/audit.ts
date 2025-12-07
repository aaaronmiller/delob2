import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { Parser } from '../bridge/parser.js';
import { FingerprintDetector, FileAnalysis } from '../forensics/fingerprint-detector.js';

/**
 * Audit Phase
 *
 * Systematically analyzes project structure and session logs for issues.
 *
 * Precondition: .claude/ exists and passes integrity check
 * Input: .delobotomize/proxy.log (via bridge), project file system
 * Output: audit-report.md, file-inventory.json, session-incidents.json
 * Duration: <10 minutes for 10K files
 */
export async function runAudit(): Promise<void> {
  const spinner = ora('Running audit phase...').start();

  try {
    const projectRoot = process.cwd();
    const delobotomizeDir = path.join(projectRoot, '.delobotomize');
    const runId = generateRunId();
    const auditDir = path.join(delobotomizeDir, 'runs', runId, 'audit');

    // Create audit directory
    await fs.mkdir(auditDir, { recursive: true });

    // Step 1: Scan project structure
    spinner.text = 'Scanning project structure...';
    const fileInventory = await scanProjectStructure(projectRoot);
    await fs.writeFile(
      path.join(auditDir, 'file-inventory.json'),
      JSON.stringify(fileInventory, null, 2)
    );

    // Step 2: Parse proxy logs
    spinner.text = 'Parsing proxy logs...';
    const sessionIncidents = await parseProxyLogs(delobotomizeDir);
    await fs.writeFile(
      path.join(auditDir, 'session-incidents.json'),
      JSON.stringify(sessionIncidents, null, 2)
    );

    // Step 3: Generate audit report
    spinner.text = 'Generating audit report...';
    const report = await generateAuditReport(fileInventory, sessionIncidents);
    await fs.writeFile(
      path.join(auditDir, 'audit-report.md'),
      report
    );

    spinner.succeed(chalk.green('✓ Audit phase completed'));
    console.log(chalk.gray(`  Run ID: ${runId}`));
    console.log(chalk.gray(`  Output: ${auditDir}`));

  } catch (error) {
    spinner.fail('Audit phase failed');
    throw error;
  }
}

function generateRunId(): string {
  return `run-${Date.now()}`;
}

async function scanProjectStructure(projectRoot: string): Promise<any> {
  const inventory: any = {
    totalFiles: 0,
    totalDirectories: 0,
    gitTracked: false,
    hasTests: false,
    hasDocs: false,
    languages: new Set(),
    filesByExtension: {},
    largeFiles: [],
    recentlyModified: [],
    forensicFindings: [] as FileAnalysis[]
  };

  const forensicDetector = new FingerprintDetector();

  // Check if git repository
  try {
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'ignore' });
    inventory.gitTracked = true;
  } catch {
    inventory.gitTracked = false;
  }

  // Recursively scan directory
  async function scanDir(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(projectRoot, fullPath);

      // Skip node_modules, .git, dist, etc.
      if (shouldSkip(entry.name)) continue;

      if (entry.isDirectory()) {
        inventory.totalDirectories++;
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        inventory.totalFiles++;

        const ext = path.extname(entry.name);
        if (ext) {
          inventory.filesByExtension[ext] = (inventory.filesByExtension[ext] || 0) + 1;
          inventory.languages.add(ext);
        }

        // Check for test files
        if (entry.name.includes('test') || entry.name.includes('spec')) {
          inventory.hasTests = true;
        }

        // Check for documentation
        if (entry.name.match(/readme|docs|documentation/i)) {
          inventory.hasDocs = true;
        }

        // Check file size
        const stats = await fs.stat(fullPath);
        if (stats.size > 1000000) { // Files > 1MB
          inventory.largeFiles.push({
            path: relativePath,
            size: stats.size,
            modified: stats.mtime
          });
        }

        // Check recently modified (last 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (stats.mtime.getTime() > dayAgo) {
          inventory.recentlyModified.push({
            path: relativePath,
            modified: stats.mtime
          });
        }

        // Run Forensic Analysis on code files
        if (['.ts', '.js', '.tsx', '.jsx', '.py'].includes(ext)) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const analysis = await forensicDetector.analyze(relativePath, content);
            if (analysis.fingerprints.length > 0) {
              inventory.forensicFindings.push(analysis);
            }
          } catch (err) {
            // Ignore read errors
          }
        }
      }
    }
  }

  function shouldSkip(name: string): boolean {
    const skipList = [
      'node_modules',
      '.git',
      '.delobotomize',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'vendor',
      '__pycache__'
    ];
    return skipList.includes(name) || name.startsWith('.');
  }

  await scanDir(projectRoot);

  inventory.languages = Array.from(inventory.languages);
  inventory.largeFiles.sort((a, b) => b.size - a.size).slice(0, 10);
  inventory.recentlyModified.sort((a, b) => b.modified - a.modified).slice(0, 20);

  return inventory;
}

async function parseProxyLogs(delobotomizeDir: string): Promise<any> {
  const proxyLogPath = path.join(delobotomizeDir, 'proxy.log');
  const parser = new Parser();

  const incidents: any = {
    totalRequests: 0,
    rateLimits: [],
    errors: [],
    stalls: [],
    contextSaturations: [],
    reasoningOverflows: [],
    authFailures: [],
    successfulRequests: [],
    averageLatency: 0,
    totalTokens: 0,
    totalCost: 0
  };

  try {
    await fs.access(proxyLogPath);
  } catch {
    incidents.note = 'No proxy.log found';
    return incidents;
  }

  // Read and parse log file
  const content = await fs.readFile(proxyLogPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  let totalLatency = 0;

  for (const line of lines) {
    try {
      const entry = parser.parse(line);
      incidents.totalRequests++;

      // Track tokens and cost
      incidents.totalTokens += entry.prompt_tokens + entry.completion_tokens + entry.reasoning_tokens;
      incidents.totalCost += entry.cost;
      totalLatency += entry.latency_ms;

      // Categorize incidents by status
      if (entry.status === 429) {
        incidents.rateLimits.push({
          timestamp: entry.timestamp,
          session_id: entry.session_id,
          model: entry.model
        });
      } else if (entry.status === 403) {
        incidents.authFailures.push({
          timestamp: entry.timestamp,
          session_id: entry.session_id
        });
      } else if (entry.status >= 400) {
        incidents.errors.push({
          timestamp: entry.timestamp,
          status: entry.status,
          session_id: entry.session_id,
          model: entry.model
        });
      } else if (entry.status === 200) {
        incidents.successfulRequests.push({
          timestamp: entry.timestamp,
          tokens: entry.prompt_tokens + entry.completion_tokens + entry.reasoning_tokens,
          cost: entry.cost
        });
      }

      // Check for context saturation (>85% of 200k context window)
      const contextUsage = (entry.prompt_tokens + entry.reasoning_tokens) / 200000;
      if (contextUsage > 0.85) {
        incidents.contextSaturations.push({
          timestamp: entry.timestamp,
          usage: contextUsage,
          tokens: entry.prompt_tokens + entry.reasoning_tokens
        });
      }

      // Check for reasoning overflow (>80% of 10k budget)
      if (entry.reasoning_tokens > 8000) {
        incidents.reasoningOverflows.push({
          timestamp: entry.timestamp,
          tokens: entry.reasoning_tokens
        });
      }

    } catch (error) {
      // Skip malformed lines
      continue;
    }
  }

  // Calculate average latency
  if (incidents.totalRequests > 0) {
    incidents.averageLatency = Math.round(totalLatency / incidents.totalRequests);
  }

  // Detect stalls (gaps > 5 minutes between requests)
  const timestamps = incidents.successfulRequests.map((r: any) => new Date(r.timestamp).getTime());
  for (let i = 1; i < timestamps.length; i++) {
    const gap = (timestamps[i] - timestamps[i - 1]) / 1000; // seconds
    if (gap > 300) { // 5 minutes
      incidents.stalls.push({
        startTime: new Date(timestamps[i - 1]).toISOString(),
        endTime: new Date(timestamps[i]).toISOString(),
        duration: gap
      });
    }
  }

  return incidents;
}

async function generateAuditReport(inventory: any, incidents: any): Promise<string> {
  return `# Delobotomize Audit Report

## Project Overview
- **Total Files**: ${inventory.totalFiles}
- **Total Directories**: ${inventory.totalDirectories}
- **Git Tracked**: ${inventory.gitTracked ? 'Yes' : 'No'}
- **Has Tests**: ${inventory.hasTests ? 'Yes' : 'No'}
- **Has Docs**: ${inventory.hasDocs ? 'Yes' : 'No'}
- **Languages**: ${inventory.languages.join(', ')}

## File Statistics
${Object.entries(inventory.filesByExtension)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([ext, count]) => `- ${ext}: ${count} files`)
      .join('\n')}

## Large Files (>1MB)
${inventory.largeFiles.slice(0, 5).map((f: any) =>
        `- ${f.path} (${Math.round(f.size / 1024 / 1024)}MB)`
      ).join('\n') || 'None'}

## Recently Modified (Last 24h)
${inventory.recentlyModified.slice(0, 10).map((f: any) =>
        `- ${f.path}`
      ).join('\n') || 'None'}

## Forensic Evidence (LLM Fingerprints)
${inventory.forensicFindings && inventory.forensicFindings.length > 0
      ? inventory.forensicFindings.slice(0, 10).map((f: any) =>
        `### ${f.path} (Score: ${f.score})\n` +
        f.fingerprints.map((p: any) => `- [${p.severity}] ${p.name}: ${p.snippet.trim().substring(0, 60)}...`).join('\n')
      ).join('\n\n')
      : 'No LLM failure patterns detected.'}

## Session Incidents
- **Total Requests**: ${incidents.totalRequests}
- **Successful**: ${incidents.successfulRequests?.length || 0}
- **Rate Limits**: ${incidents.rateLimits?.length || 0}
- **Errors**: ${incidents.errors?.length || 0}
- **Auth Failures**: ${incidents.authFailures?.length || 0}
- **Stalls**: ${incidents.stalls?.length || 0}

## Performance Metrics
- **Average Latency**: ${incidents.averageLatency}ms
- **Total Tokens**: ${incidents.totalTokens.toLocaleString()}
- **Total Cost**: $${incidents.totalCost.toFixed(4)}

## Context Issues
- **Context Saturations**: ${incidents.contextSaturations?.length || 0}
- **Reasoning Overflows**: ${incidents.reasoningOverflows?.length || 0}

## Critical Incidents
${incidents.rateLimits?.length > 0 ? `\n### Rate Limits (${incidents.rateLimits.length})\n` +
      incidents.rateLimits.slice(0, 5).map((r: any) => `- ${r.timestamp} - Session: ${r.session_id.slice(0, 8)}...`).join('\n') : ''}

${incidents.stalls?.length > 0 ? `\n### Stalls (${incidents.stalls.length})\n` +
      incidents.stalls.map((s: any) => `- ${Math.round(s.duration / 60)}min gap at ${s.startTime}`).join('\n') : ''}

${incidents.contextSaturations?.length > 0 ? `\n### Context Saturations (${incidents.contextSaturations.length})\n` +
      incidents.contextSaturations.slice(0, 5).map((c: any) => `- ${c.timestamp} - ${(c.usage * 100).toFixed(1)}% usage`).join('\n') : ''}

## Recommendations
${incidents.rateLimits?.length > 0 ? '- **CRITICAL**: Review rate limiting configuration and adjust request patterns\n' : ''}
${incidents.errors?.length > 0 ? '- **HIGH**: Investigate error patterns - ' + incidents.errors.length + ' errors detected\n' : ''}
${incidents.stalls?.length > 0 ? '- **HIGH**: Analyze stall conditions - ' + incidents.stalls.length + ' stalls detected\n' : ''}
${incidents.contextSaturations?.length > 0 ? '- **MEDIUM**: Context approaching limits - consider chunking strategy\n' : ''}
${incidents.reasoningOverflows?.length > 0 ? '- **MEDIUM**: Reasoning budget being exceeded frequently\n' : ''}
${inventory.largeFiles?.length > 0 ? '- **LOW**: Consider splitting large files for better manageability\n' : ''}
${inventory.forensicFindings?.length > 0 ? `- **HIGH**: Detected ${inventory.forensicFindings.length} suspicious files with LLM fingerprints. Run deep analysis.\n` : ''}
${!inventory.hasTests ? '- **LOW**: No test files detected - consider adding tests\n' : ''}

---
Generated: ${new Date().toISOString()}
Delobotomize v15.0
`;
}
