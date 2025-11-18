import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';

export const initCommand = new Command('init')
  .description('Initialize Delobotomize in the current project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const spinner = ora('Initializing Delobotomize...').start();

    try {
      const projectPath = path.resolve(options.path);
      const claudeDir = path.join(projectPath, '.claude');
      const claudeDocsDir = path.join(projectPath, 'claude docs');
      const delobDir = path.join(projectPath, '.delobotomize');

      // Check if claude docs/ exists
      try {
        await fs.access(claudeDocsDir);
      } catch {
        spinner.fail(chalk.red('Error: claude docs/ directory not found'));
        console.log(chalk.yellow('Please ensure claude docs/ exists in your project root'));
        process.exit(1);
      }

      // Create .claude directory structure
      spinner.text = 'Creating .claude directory structure...';
      await fs.mkdir(claudeDir, { recursive: true });

      // Mirror claude docs/ to .claude/
      spinner.text = 'Mirroring claude docs/ to .claude/...';
      await mirrorDirectory(claudeDocsDir, claudeDir);

      // Create .delobotomize structure
      spinner.text = 'Creating .delobotomize directory structure...';
      await fs.mkdir(path.join(delobDir, 'runs'), { recursive: true });
      await fs.mkdir(path.join(delobDir, 'checkpoints'), { recursive: true });

      // Verify integrity
      spinner.text = 'Verifying claude docs integrity...';
      const integrityResult = await verifyIntegrity(claudeDocsDir, claudeDir);

      if (!integrityResult.success) {
        spinner.warn(chalk.yellow('Warning: Integrity check found differences'));
        console.log(chalk.dim(JSON.stringify(integrityResult.differences, null, 2)));
      }

      // Write integrity report
      await fs.writeFile(
        path.join(delobDir, 'claude-docs-integrity.json'),
        JSON.stringify(integrityResult, null, 2)
      );

      spinner.succeed(chalk.green('Delobotomize initialized successfully'));
      console.log(chalk.dim(`  .claude/ directory created`));
      console.log(chalk.dim(`  .delobotomize/ directory created`));
      console.log(chalk.dim(`  Integrity report: .delobotomize/claude-docs-integrity.json`));

    } catch (error) {
      spinner.fail(chalk.red('Initialization failed'));
      console.error(error);
      process.exit(1);
    }
  });

async function mirrorDirectory(source: string, target: string): Promise<void> {
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      await mirrorDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function verifyIntegrity(source: string, target: string): Promise<{ success: boolean; differences: string[] }> {
  const differences: string[] = [];

  async function compareDirectories(src: string, tgt: string, relativePath = ''): Promise<void> {
    const sourceEntries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of sourceEntries) {
      const srcPath = path.join(src, entry.name);
      const tgtPath = path.join(tgt, entry.name);
      const relPath = path.join(relativePath, entry.name);

      // Skip CLAUDE.md as it's generated
      if (entry.name === 'CLAUDE.md') continue;

      if (entry.isDirectory()) {
        try {
          await fs.access(tgtPath);
          await compareDirectories(srcPath, tgtPath, relPath);
        } catch {
          differences.push(`Missing directory: ${relPath}`);
        }
      } else {
        try {
          const srcContent = await fs.readFile(srcPath, 'utf-8');
          const tgtContent = await fs.readFile(tgtPath, 'utf-8');

          if (srcContent !== tgtContent) {
            differences.push(`File differs: ${relPath}`);
          }
        } catch {
          differences.push(`Missing file: ${relPath}`);
        }
      }
    }
  }

  await compareDirectories(source, target);

  return {
    success: differences.length === 0,
    differences
  };
}
