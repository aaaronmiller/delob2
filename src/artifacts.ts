import fs from 'fs/promises';
import path from 'path';

/**
 * Artifact Management
 *
 * Handles creation, validation, and cleanup of run artifacts
 */

export interface RunManifest {
  run_id: string;
  start_time: string;
  end_time?: string;
  phases_completed: string[];
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export async function createRunDirectory(projectRoot: string): Promise<string> {
  const delobotomizeDir = path.join(projectRoot, '.delobotomize');
  const runsDir = path.join(delobotomizeDir, 'runs');
  const runId = `run-${Date.now()}`;
  const runDir = path.join(runsDir, runId);

  await fs.mkdir(runDir, { recursive: true });

  // Create manifest
  const manifest: RunManifest = {
    run_id: runId,
    start_time: new Date().toISOString(),
    phases_completed: [],
    status: 'running'
  };

  await fs.writeFile(
    path.join(runDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return runDir;
}

export async function updateRunManifest(
  runDir: string,
  updates: Partial<RunManifest>
): Promise<void> {
  const manifestPath = path.join(runDir, 'manifest.json');
  const content = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  const updated = { ...manifest, ...updates };

  await fs.writeFile(manifestPath, JSON.stringify(updated, null, 2));
}

export async function cleanupOldRuns(projectRoot: string, keepCount: number = 10): Promise<void> {
  const delobotomizeDir = path.join(projectRoot, '.delobotomize');
  const runsDir = path.join(delobotomizeDir, 'runs');

  try {
    const runs = await fs.readdir(runsDir);
    const sorted = runs.sort().reverse();

    // Delete old runs beyond keepCount
    const toDelete = sorted.slice(keepCount);

    for (const run of toDelete) {
      const runPath = path.join(runsDir, run);
      await fs.rm(runPath, { recursive: true, force: true });
    }
  } catch {
    // Runs directory doesn't exist yet
  }
}

export async function listRuns(projectRoot: string): Promise<RunManifest[]> {
  const delobotomizeDir = path.join(projectRoot, '.delobotomize');
  const runsDir = path.join(delobotomizeDir, 'runs');

  try {
    const runs = await fs.readdir(runsDir);
    const manifests: RunManifest[] = [];

    for (const run of runs) {
      const manifestPath = path.join(runsDir, run, 'manifest.json');
      try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        manifests.push(JSON.parse(content));
      } catch {
        // Skip invalid runs
      }
    }

    return manifests.sort((a, b) => b.start_time.localeCompare(a.start_time));
  } catch {
    return [];
  }
}
