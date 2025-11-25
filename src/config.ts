import fs from 'fs/promises';
import path from 'path';

/**
 * Configuration Management
 *
 * Loads and manages unified configuration from .claude/settings.json
 */

export interface DelobotomizeConfig {
  delobotomize: {
    phases: string[];
    integrity_check: boolean;
    artifact_ttl_minutes: number;
  };
  multi_agent_workflow: {
    hooks: {
      enabled: boolean;
      server_url: string;
      timeout_ms: number;
      scripts: Record<string, string>;
    };
    dashboard: {
      enabled: boolean;
      port: number;
      auto_start: boolean;
    };
  };
  claude_code_proxy: {
    port: number;
    providers: Record<string, any>;
    model_routing: {
      big: string;
      middle: string;
      small: string;
    };
    file_logging: {
      enabled: boolean;
      path: string;
    };
    reasoning: {
      enabled: boolean;
      budget: number;
    };
  };
  project: {
    name: string;
    root: string;
    version: string;
  };
}

export async function loadConfig(): Promise<DelobotomizeConfig> {
  const projectRoot = process.cwd();
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    const config = JSON.parse(content);
    return config as DelobotomizeConfig;
  } catch (error) {
    throw new Error(`Failed to load configuration from ${settingsPath}: ${error}`);
  }
}

export async function saveConfig(config: DelobotomizeConfig): Promise<void> {
  const projectRoot = process.cwd();
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

  await fs.writeFile(settingsPath, JSON.stringify(config, null, 2));
}

export async function getConfigValue<T>(path: string): Promise<T | undefined> {
  const config = await loadConfig();
  const parts = path.split('.');
  let value: any = config;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value as T;
}
