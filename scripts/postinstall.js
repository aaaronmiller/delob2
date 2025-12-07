#!/usr/bin/env node

/**
 * Post-install script
 * 
 * Runs after npm install to:
 * 1. Copy template files from claude-code/ to user's .claude/
 * 2. Create .delobotomize/ directory structure
 * 3. Set up initial configuration
 */

const fs = require('fs');
const path = require('path');

console.log('Running Delobotomize post-install...\n');

const installDir = process.cwd();
const claudeCodeDir = path.join(__dirname, '..', 'claude-code');

/**
 * Copy directory recursively
 */
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`  ⚠ Source not found: ${src}`);
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else if (entry.isFile()) {
            // Skip .template files - these are processed separately
            if (entry.name.endsWith('.template')) {
                continue;
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Ensure directories exist
 */
function ensureDirs() {
    const dirs = [
        '.claude',
        '.claude/agents',
        '.claude/skills',
        '.claude/hooks',
        '.claude/commands',
        '.delobotomize',
        '.delobotomize/cache',
        '.delobotomize/runs'
    ];

    for (const dir of dirs) {
        const fullPath = path.join(installDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`  ✓ Created ${dir}/`);
        }
    }
}

/**
 * Copy hook scripts
 */
function copyHooks() {
    const hooksDir = path.join(claudeCodeDir, 'hooks');
    const destHooksDir = path.join(installDir, '.claude', 'hooks');

    if (fs.existsSync(hooksDir)) {
        console.log('  Copying hook scripts...');
        copyDirSync(hooksDir, destHooksDir);

        // Make hooks executable
        const hooks = fs.readdirSync(destHooksDir);
        for (const hook of hooks) {
            const hookPath = path.join(destHooksDir, hook);
            try {
                fs.chmodSync(hookPath, '755');
            } catch (e) {
                // Windows doesn't support chmod, ignore
            }
        }
        console.log(`  ✓ Copied ${hooks.length} hook scripts`);
    }
}

/**
 * Create default settings.json if it doesn't exist
 */
function createSettings() {
    const settingsPath = path.join(installDir, '.claude', 'settings.json');
    const templatePath = path.join(claudeCodeDir, 'settings.json.template');

    if (fs.existsSync(settingsPath)) {
        console.log('  ℹ settings.json already exists, skipping');
        return;
    }

    if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, 'utf-8');

        // Replace template variables
        content = content.replace(/\${PROJECT_NAME}/g, path.basename(installDir));
        content = content.replace(/\${PROJECT_ROOT}/g, installDir);
        content = content.replace(/\${ANTHROPIC_API_KEY}/g, process.env.ANTHROPIC_API_KEY || '');

        fs.writeFileSync(settingsPath, content);
        console.log('  ✓ Created settings.json');
    }
}

/**
 * Create CLAUDE.md if it doesn't exist
 */
function createClaudeMd() {
    const claudeMdPath = path.join(installDir, '.claude', 'CLAUDE.md');
    const templatePath = path.join(claudeCodeDir, 'CLAUDE.base.md');

    if (fs.existsSync(claudeMdPath)) {
        console.log('  ℹ CLAUDE.md already exists, skipping');
        return;
    }

    if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, claudeMdPath);
        console.log('  ✓ Created CLAUDE.md');
    }
}

// Main execution
try {
    // Only run if we're in a project directory (not global install)
    const pkgPath = path.join(installDir, 'package.json');

    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

        // Skip if this is the delobotomize package itself
        if (pkg.name === 'delobotomize') {
            console.log('  ℹ Delobotomize package development mode');
            console.log('  ℹ Run `delobotomize init` in target projects\n');
            console.log('✓ Post-install complete\n');
            process.exit(0);
        }
    }

    console.log('Setting up Delobotomize in project...\n');

    ensureDirs();
    copyHooks();
    createSettings();
    createClaudeMd();

    console.log('\n✓ Post-install complete');
    console.log('\nNext steps:');
    console.log('  1. Set ANTHROPIC_API_KEY environment variable');
    console.log('  2. Run: delobotomize init');
    console.log('  3. Run: delobotomize stack start\n');

} catch (error) {
    console.error('Post-install error:', error.message);
    // Don't fail installation, just warn
    console.log('\n⚠ Post-install completed with warnings');
    console.log('  Run `delobotomize init` to set up manually\n');
}
