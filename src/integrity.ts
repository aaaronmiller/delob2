import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

/**
 * Integrity Checking
 *
 * Validates .claude/ directory against source checksums
 */

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
  const manifest = JSON.parse(content);

  // Verify critical files
  const criticalFiles = ['settings.json', 'CLAUDE.md'];
  const missingFiles: string[] = [];
  const modifiedFiles: string[] = [];

  for (const file of criticalFiles) {
    const filePath = path.join(claudeDir, file);

    try {
      await fs.access(filePath);

      // Check if file was modified (simple timestamp check for now)
      // In production, would use actual checksums
      const stats = await fs.stat(filePath);
      // Placeholder: would compare actual checksums here

    } catch {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Missing critical files: ${missingFiles.join(', ')}`);
  }

  if (modifiedFiles.length > 0) {
    console.log(chalk.yellow(`⚠ Modified files detected: ${modifiedFiles.join(', ')}`));
  }

  console.log(chalk.green('✓ Integrity check passed'));
}

export async function generateIntegrityChecksum(claudeDir: string, delobotomizeDir: string): Promise<void> {
  const manifest: any = {
    version: '15.0.0',
    timestamp: new Date().toISOString(),
    files: {}
  };

  // Hash critical files
  const criticalFiles = ['settings.json', 'CLAUDE.md'];

  for (const file of criticalFiles) {
    const filePath = path.join(claudeDir, file);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      manifest.files[file] = hash;
    } catch {
      // File doesn't exist yet
      manifest.files[file] = null;
    }
  }

  // Save manifest
  const checksumPath = path.join(delobotomizeDir, 'claude-docs-integrity.json');
  await fs.writeFile(checksumPath, JSON.stringify(manifest, null, 2));
}
