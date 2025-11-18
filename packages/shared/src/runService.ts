import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { RunManifest, PhaseRecord } from './types.js';

export class RunService {
  async createRun(projectPath: string): Promise<RunManifest> {
    const runId = this.generateRunId();
    const runDir = join(projectPath, '.delobotomize', 'runs', runId);

    await mkdir(runDir, { recursive: true });
    await mkdir(join(runDir, 'artifacts'), { recursive: true });
    await mkdir(join(runDir, 'logs'), { recursive: true });

    const manifest: RunManifest = {
      runId,
      timestamp: new Date().toISOString(),
      projectPath,
      phases: [],
      alerts: [],
      metrics: {
        totalTokens: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        phases: 0
      },
      status: 'pending'
    };

    await this.saveManifest(runDir, manifest);

    return manifest;
  }

  async getRunManifest(projectPath: string, runId: string): Promise<RunManifest | null> {
    const runDir = join(projectPath, '.delobotomize', 'runs', runId);
    const manifestPath = join(runDir, 'manifest.json');

    try {
      const content = await readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listRuns(projectPath: string): Promise<RunManifest[]> {
    const runsDir = join(projectPath, '.delobotomize', 'runs');

    try {
      const entries = await readdir(runsDir, { withFileTypes: true });
      const manifests: RunManifest[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifest = await this.getRunManifest(projectPath, entry.name);
          if (manifest) {
            manifests.push(manifest);
          }
        }
      }

      return manifests.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch {
      return [];
    }
  }

  async updatePhase(
    runDir: string,
    manifest: RunManifest,
    phaseName: string,
    updates: Partial<PhaseRecord>
  ): Promise<void> {
    let phase = manifest.phases.find(p => p.name === phaseName);

    if (!phase) {
      phase = {
        name: phaseName,
        status: 'pending',
        artifacts: []
      };
      manifest.phases.push(phase);
    }

    Object.assign(phase, updates);

    if (updates.status === 'completed' && phase.startTime && !phase.endTime) {
      phase.endTime = new Date().toISOString();
      phase.duration = new Date(phase.endTime).getTime() - new Date(phase.startTime).getTime();
    }

    manifest.metrics.phases = manifest.phases.filter(p => p.status === 'completed').length;

    await this.saveManifest(runDir, manifest);
  }

  async saveManifest(runDir: string, manifest: RunManifest): Promise<void> {
    const manifestPath = join(runDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  private generateRunId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `run_${timestamp}_${random}`;
  }
}
