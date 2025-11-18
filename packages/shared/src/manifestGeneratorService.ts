import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { RunManifest } from './types.js';

export class ManifestGeneratorService {
  async generateManifest(
    runDir: string,
    runManifest: RunManifest
  ): Promise<void> {
    // Generate the canonical manifest JSON
    await writeFile(
      join(runDir, 'manifest.json'),
      JSON.stringify(runManifest, null, 2)
    );

    // Generate human-readable manifest summary
    const summary = this.generateSummary(runManifest);
    await writeFile(join(runDir, 'MANIFEST.md'), summary);
  }

  private generateSummary(manifest: RunManifest): string {
    const lines: string[] = [];

    lines.push(`# Run Manifest: ${manifest.runId}`);
    lines.push('');
    lines.push(`**Timestamp**: ${manifest.timestamp}`);
    lines.push(`**Project**: ${manifest.projectPath}`);
    lines.push(`**Status**: ${manifest.status}`);
    lines.push('');

    // Phases
    lines.push('## Phases');
    lines.push('');
    for (const phase of manifest.phases) {
      lines.push(`### ${phase.name}`);
      lines.push(`- Status: ${phase.status}`);
      if (phase.startTime) {
        lines.push(`- Started: ${phase.startTime}`);
      }
      if (phase.endTime) {
        lines.push(`- Ended: ${phase.endTime}`);
        lines.push(`- Duration: ${phase.duration}ms`);
      }
      if (phase.artifacts.length > 0) {
        lines.push(`- Artifacts: ${phase.artifacts.join(', ')}`);
      }
      lines.push('');
    }

    // Metrics
    lines.push('## Metrics');
    lines.push('');
    lines.push(`- Total Tokens: ${manifest.metrics.totalTokens}`);
    lines.push(`- Total Alerts: ${manifest.metrics.totalAlerts}`);
    lines.push(`- Critical Alerts: ${manifest.metrics.criticalAlerts}`);
    lines.push(`- Completed Phases: ${manifest.metrics.phases}`);
    if (manifest.metrics.estimatedCost) {
      lines.push(`- Estimated Cost: $${manifest.metrics.estimatedCost.toFixed(4)}`);
    }
    lines.push('');

    // Alerts
    if (manifest.alerts.length > 0) {
      lines.push('## Alerts');
      lines.push('');
      for (const alert of manifest.alerts) {
        lines.push(`- [${alert.severity.toUpperCase()}] ${alert.message} (${alert.timestamp})`);
      }
      lines.push('');
    }

    // Integrity Check
    if (manifest.integrityCheck) {
      lines.push('## Integrity Check');
      lines.push('');
      lines.push(`- Status: ${manifest.integrityCheck.success ? '✓ Passed' : '✗ Failed'}`);
      lines.push(`- Total Files: ${manifest.integrityCheck.totalFiles}`);
      if (manifest.integrityCheck.differences.length > 0) {
        lines.push('- Differences:');
        for (const diff of manifest.integrityCheck.differences) {
          lines.push(`  - ${diff}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
