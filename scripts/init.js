#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const NC = '\x1b[0m';

function log(msg, type = 'info') {
  const color = type === 'success' ? GREEN : type === 'warn' ? YELLOW : type === 'error' ? RED : '';
  console.log(`${color}${msg}${NC}`);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return 0;
  
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      count += copyDirectory(srcPath, destPath);
    } else {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        count++;
      }
    }
  }
  return count;
}

function findOpencodeJson() {
  const candidates = [
    path.join(process.cwd(), 'opencode.json'),
    path.join(process.cwd(), 'opencode.jsonc'),
    path.join(process.env.HOME || '', '.config/opencode/opencode.json'),
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(process.cwd(), 'opencode.json');
}

function loadJson(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

function saveJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
}

function mergeConfig(configPath, key, newData) {
  try {
    const config = loadJson(configPath);
    if (!config[key]) {
      config[key] = {};
    }
    let merged = false;
    for (const [subKey, value] of Object.entries(newData)) {
      if (!config[key][subKey]) {
        config[key][subKey] = value;
        merged = true;
      }
    }
    if (merged) {
      saveJson(configPath, config);
      return true;
    }
    return false;
  } catch (e) {
    log(`Error merging ${key}: ${e.message}`, 'error');
    return false;
  }
}

async function main() {
  console.log(`\n${BOLD}OpenCode Supercharger Installer${NC}`);
  console.log(`  Project: ${PROJECT_ROOT}\n`);
  
  const opencodeJsonPath = findOpencodeJson();
  log(`  Config: ${opencodeJsonPath}`);
  
  const skillsSrc = path.join(PROJECT_ROOT, 'configs/skills');
  const skillsDest = path.join(PROJECT_ROOT, '.opencode/skills');
  const skillsCount = copyDirectory(skillsSrc, skillsDest);
  if (skillsCount > 0) {
    log(`  ✓ Copied ${skillsCount} skill(s) to .opencode/skills/`, 'success');
  } else {
    log(`  ✓ Skills already installed`, 'info');
  }
  
  const rulesSrc = path.join(PROJECT_ROOT, 'configs/rules');
  const rulesDest = path.join(PROJECT_ROOT, '.opencode/rules');
  const rulesCount = copyDirectory(rulesSrc, rulesDest);
  if (rulesCount > 0) {
    log(`  ✓ Copied ${rulesCount} rule(s) to .opencode/rules/`, 'success');
  } else {
    log(`  ✓ Rules already installed`, 'info');
  }
  
  try {
    const config = loadJson(opencodeJsonPath);
    if (!config.plugin) {
      config.plugin = [];
    }
    const pluginName = '@opencode-supercharger/plugin';
    if (!config.plugin.includes(pluginName)) {
      config.plugin.push(pluginName);
      saveJson(opencodeJsonPath, config);
      log(`  ✓ Added plugin to ${path.basename(opencodeJsonPath)}`, 'success');
    } else {
      log(`  ✓ Plugin already registered`, 'info');
    }
  } catch (e) {
    log(`  Could not update plugin: ${e.message}`, 'warn');
  }
  
  const agentsPath = path.join(PROJECT_ROOT, 'configs/agents.json');
  if (fs.existsSync(agentsPath)) {
    const agentsData = loadJson(agentsPath);
    if (agentsData.agent && mergeConfig(opencodeJsonPath, 'agent', agentsData.agent)) {
      log(`  ✓ Merged agent config`, 'success');
    } else {
      log(`  ✓ Agent config already merged`, 'info');
    }
  }
  
  const commandsPath = path.join(PROJECT_ROOT, 'configs/commands.json');
  if (fs.existsSync(commandsPath)) {
    const commandsData = loadJson(commandsPath);
    if (commandsData.command && mergeConfig(opencodeJsonPath, 'command', commandsData.command)) {
      log(`  ✓ Merged command config`, 'success');
    } else {
      log(`  ✓ Command config already merged`, 'info');
    }
  }
  
  console.log(`\n${GREEN}Done!${NC} Restart OpenCode to activate.\n`);
}

main().catch(e => {
  log(`Error: ${e.message}`, 'error');
  process.exit(1);
});