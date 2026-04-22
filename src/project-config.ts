import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

interface ProjectConfig {
  disableHooks?: string[]
  disableAgents?: string[]
  customRules?: string[]
}

const CONFIG_FILE = ".supercharger.json"

export function loadProjectConfig(projectDir: string): ProjectConfig | null {
  const configPath = path.join(projectDir, CONFIG_FILE)
  
  if (!existsSync(configPath)) {
    return null
  }

  try {
    const content = readFileSync(configPath, "utf8")
    const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    return JSON.parse(clean)
  } catch {
    return null
  }
}

export function isHookDisabled(projectDir: string, hookName: string): boolean {
  const config = loadProjectConfig(projectDir)
  if (!config || !config.disableHooks) {
    return false
  }
  return config.disableHooks.includes(hookName)
}

export function isAgentDisabled(projectDir: string, agentName: string): boolean {
  const config = loadProjectConfig(projectDir)
  if (!config || !config.disableAgents) {
    return false
  }
  return config.disableAgents.includes(agentName)
}