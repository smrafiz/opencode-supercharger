import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { homedir } from "node:os"

const CHECKPOINT_FILE = ".supercharger-checkpoint.json"

interface CheckpointData {
  filesModified: string[]
  sessionStart: string
  lastWrite: string
}

function checkpointDir(): string {
  return path.join(homedir(), ".config", "opencode", "supercharger")
}

function checkpointPath(projectDir: string): string {
  return path.join(projectDir, CHECKPOINT_FILE)
}

export function writeCheckpoint(projectDir: string, modifiedFiles: string[]): void {
  try {
    const dir = checkpointDir()
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const data: CheckpointData = {
      filesModified: modifiedFiles.slice(-50),
      sessionStart: new Date().toISOString(),
      lastWrite: new Date().toISOString(),
    }

    writeFileSync(checkpointPath(projectDir), JSON.stringify(data, null, 2))
  } catch {}
}

export function readCheckpoint(projectDir: string): CheckpointData | null {
  try {
    const file = checkpointPath(projectDir)
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf8"))
    }
  } catch {}
  return null
}

export function hasCheckpoint(projectDir: string): boolean {
  return existsSync(checkpointPath(projectDir))
}

export function clearCheckpoint(projectDir: string): void {
  try {
    const file = checkpointPath(projectDir)
    if (existsSync(file)) {
      const fs = require("node:fs")
      fs.unlinkSync(file)
    }
  } catch {}
}