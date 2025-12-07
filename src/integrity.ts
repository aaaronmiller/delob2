import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

/**
 * Integrity Checking
 *
 * Validates .claude/ directory against source checksums.
 * Per PRD: "pipelines fail fast if .claude/ deviates from claude docs/"
 */

interface IntegrityManifest {
  version: string;
  timestamp: string;
  files: Record<string, string | null>;
}

export async function checkIntegrity(): Promise<void> {
  const projectRoot = process.cwd();
  const claudeDir = path.join(projectRoot, '.claude');
  const delobotomizeDir = path.join(projectRoot, '.delobotomize');
  const checksumPath = path.join(delobotomizeDir, 'claude-docs-integrity.json');

  // Check if .claude directory exists
  try {
    await fs.access(claudeDir);
  } catch {
    throw new Error('.claude directory not found. Run: delobotomize init');
  }

  // Check if checksum file exists
  try {
    await fs.access(checksumPath);
  } catch {
    console.log(chalk.yellow('⚠ No integrity checksum found. Generating...'));
    await generateIntegrityChecksum(claudeDir, delobotomizeDir);
    return;
  }

  // Load checksum manifest
  const content = await fs.readFile(checksumPath, 'utf-8');
  const manifest: IntegrityManifest = JSON.parse(content);

  // Perform full directory comparison
  const currentHashes = await hashDirectory(claudeDir);
  const missingFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const newFiles: string[] = [];

  // Check for missing or modified files
  for (const [file, expectedHash] of Object.entries(manifest.files)) {
    if (expectedHash === null) continue; // File was expected to not exist

    const currentHash = currentHashes.get(file);
    if (currentHash === undefined) {
      missingFiles.push(file);
    } else if (currentHash !== expectedHash) {
      modifiedFiles.push(file);
    }
  }

  // Check for new files not in manifest
  for (const [file, _hash] of currentHashes) {
    if (!(file in manifest.files)) {
      newFiles.push(file);
    }
  }

  // Report findings
  if (missingFiles.length > 0) {
    console.log(chalk.red(`✗ Missing critical files: ${missingFiles.join(', ')}`));
  }

  if (modifiedFiles.length > 0) {
    console.log(chalk.yellow(`⚠ Modified files detected: ${modifiedFiles.join(', ')}`));
    console.log(chalk.gray('  Run `delobotomize init` to restore from source templates.'));
  }

  if (newFiles.length > 0) {
    console.log(chalk.blue(`ℹ New files found: ${newFiles.join(', ')}`));
  }

  // Fail on missing files (per PRD: "pipelines fail fast")
  if (missingFiles.length > 0) {
    throw new Error(`Missing critical files: ${missingFiles.join(', ')}`);
  }

  console.log(chalk.green('✓ Integrity check passed'));
}

export async function generateIntegrityChecksum(claudeDir: string, delobotomizeDir: string): Promise<void> {
  // Ensure delobotomize directory exists
  await fs.mkdir(delobotomizeDir, { recursive: true });

  // Hash all files in .claude/
  const fileHashes = await hashDirectory(claudeDir);

  const manifest: IntegrityManifest = {
    version: '15.0.0',
    timestamp: new Date().toISOString(),
    files: Object.fromEntries(fileHashes)
  };

  // Save manifest
  const checksumPath = path.join(delobotomizeDir, 'claude-docs-integrity.json');
  await fs.writeFile(checksumPath, JSON.stringify(manifest, null, 2));

  console.log(chalk.green(`✓ Generated integrity manifest for ${fileHashes.size} files`));
}

/**
 * Recursively hash all files in a directory
 */
async function hashDirectory(dir: string, prefix: string = ''): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively hash subdirectory
        const subHashes = await hashDirectory(fullPath, relativePath);
        for (const [file, hash] of subHashes) {
          hashes.set(file, hash);
        }
      } else if (entry.isFile()) {
        // Hash file
        const content = await fs.readFile(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        hashes.set(relativePath, hash);
      }
    }
  } catch (error) {
    // Directory doesn't exist or is inaccessible
  }

  return hashes;
}

/**
 * Compare two directories and return differences
 */
export async function compareDirectories(
  sourceDir: string,
  targetDir: string
): Promise<{
  missing: string[];
  modified: string[];
  extra: string[];
}> {
  const sourceHashes = await hashDirectory(sourceDir);
  const targetHashes = await hashDirectory(targetDir);

  const missing: string[] = [];
  const modified: string[] = [];
  const extra: string[] = [];

  // Find missing or modified files
  for (const [file, sourceHash] of sourceHashes) {
    const targetHash = targetHashes.get(file);
    if (targetHash === undefined) {
      missing.push(file);
    } else if (targetHash !== sourceHash) {
      modified.push(file);
    }
  }

  // Find extra files in target
  for (const [file, _hash] of targetHashes) {
    if (!sourceHashes.has(file)) {
      extra.push(file);
    }
  }

  return { missing, modified, extra };
}
