import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class ArtifactService {
  async writeArtifact(
    runDir: string,
    phase: string,
    filename: string,
    content: string
  ): Promise<string> {
    const artifactDir = join(runDir, 'artifacts', phase);
    await mkdir(artifactDir, { recursive: true });

    const artifactPath = join(artifactDir, filename);
    await writeFile(artifactPath, content);

    return artifactPath;
  }

  async writeAuditReport(
    runDir: string,
    findings: {
      incidents: any[];
      tokenPressure: any[];
      rateLimits: any[];
      refusals: any[];
      deadlocks: any[];
    }
  ): Promise<string> {
    const content = this.formatAuditReport(findings);
    return this.writeArtifact(runDir, 'audit', 'AUDIT_REPORT.md', content);
  }

  async writeAnalysisReport(
    runDir: string,
    analysis: {
      causalChains: any[];
      evidence: any[];
      hypotheses: any[];
    }
  ): Promise<string> {
    const content = this.formatAnalysisReport(analysis);
    return this.writeArtifact(runDir, 'analysis', 'ANALYSIS_REPORT.md', content);
  }

  async writeRecoveryPlan(
    runDir: string,
    plan: {
      tasks: any[];
      dependencies: any[];
      confidence: number;
    }
  ): Promise<string> {
    const content = this.formatRecoveryPlan(plan);
    return this.writeArtifact(runDir, 'recovery', 'RECOVERY_PLAN.md', content);
  }

  async writeFixReport(
    runDir: string,
    fixes: {
      changes: any[];
      diffs: string[];
      approvals: any[];
    }
  ): Promise<string> {
    const content = this.formatFixReport(fixes);
    return this.writeArtifact(runDir, 'fix', 'FIX_REPORT.md', content);
  }

  private formatAuditReport(findings: any): string {
    const lines: string[] = [];

    lines.push('# Audit Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Session Incidents');
    lines.push('');
    lines.push(`Found ${findings.incidents.length} incidents`);
    lines.push('');

    lines.push('## Token Pressure');
    lines.push('');
    lines.push(`Detected ${findings.tokenPressure.length} token pressure events`);
    lines.push('');

    lines.push('## Rate Limits');
    lines.push('');
    lines.push(`Encountered ${findings.rateLimits.length} rate limit events`);
    lines.push('');

    lines.push('## Refusals');
    lines.push('');
    lines.push(`Detected ${findings.refusals.length} model refusals`);
    lines.push('');

    lines.push('## Deadlocks');
    lines.push('');
    lines.push(`Suspected ${findings.deadlocks.length} deadlock events`);
    lines.push('');

    return lines.join('\n');
  }

  private formatAnalysisReport(analysis: any): string {
    const lines: string[] = [];

    lines.push('# Analysis Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Causal Chains');
    lines.push('');
    for (const chain of analysis.causalChains) {
      lines.push(`- ${JSON.stringify(chain)}`);
    }
    lines.push('');

    lines.push('## Evidence');
    lines.push('');
    for (const evidence of analysis.evidence) {
      lines.push(`- ${JSON.stringify(evidence)}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  private formatRecoveryPlan(plan: any): string {
    const lines: string[] = [];

    lines.push('# Recovery Plan');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Confidence: ${(plan.confidence * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('## Tasks');
    lines.push('');
    for (const task of plan.tasks) {
      lines.push(`### ${task.id}`);
      lines.push(`- ${JSON.stringify(task)}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatFixReport(fixes: any): string {
    const lines: string[] = [];

    lines.push('# Fix Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Changes Applied');
    lines.push('');
    for (const change of fixes.changes) {
      lines.push(`- ${JSON.stringify(change)}`);
    }
    lines.push('');

    return lines.join('\n');
  }
}
