import { readFile, access } from 'fs/promises';
import { join } from 'path';
import type { IntegrityCheckResult } from './types.js';

export class ValidationService {
  async validateProjectStructure(projectPath: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check for required directories
    const requiredDirs = ['.claude', '.delobotomize', 'claude docs'];

    for (const dir of requiredDirs) {
      try {
        await access(join(projectPath, dir));
      } catch {
        errors.push(`Missing required directory: ${dir}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async checkIntegrity(
    claudeDocsPath: string,
    claudePath: string
  ): Promise<IntegrityCheckResult> {
    const differences: string[] = [];
    let totalFiles = 0;

    async function compareDirectories(
      source: string,
      target: string,
      relativePath = ''
    ): Promise<void> {
      const fs = await import('fs/promises');

      try {
        const sourceEntries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of sourceEntries) {
          const sourcePath = join(source, entry.name);
          const targetPath = join(target, entry.name);
          const relPath = join(relativePath, entry.name);

          // Skip CLAUDE.md as it's dynamically generated
          if (entry.name === 'CLAUDE.md') continue;

          if (entry.isDirectory()) {
            try {
              await access(targetPath);
              await compareDirectories(sourcePath, targetPath, relPath);
            } catch {
              differences.push(`Missing directory: ${relPath}`);
            }
          } else {
            totalFiles++;
            try {
              const sourceContent = await readFile(sourcePath, 'utf-8');
              const targetContent = await readFile(targetPath, 'utf-8');

              if (sourceContent !== targetContent) {
                differences.push(`File differs: ${relPath}`);
              }
            } catch {
              differences.push(`Missing file: ${relPath}`);
            }
          }
        }
      } catch (error) {
        differences.push(`Error reading directory: ${relativePath}`);
      }
    }

    await compareDirectories(claudeDocsPath, claudePath);

    return {
      success: differences.length === 0,
      timestamp: new Date().toISOString(),
      differences,
      totalFiles
    };
  }

  async validateSettings(settingsPath: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const content = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      // Validate required fields
      if (!settings.mcpServers && !settings.tools) {
        errors.push('Settings must contain either mcpServers or tools configuration');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read or parse settings: ${error}`]
      };
    }
  }
}
