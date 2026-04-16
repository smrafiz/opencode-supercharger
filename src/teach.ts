import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { homedir } from "node:os"

const STORAGE_FILE = "learnings.json"

interface Learning {
  type: "blocked" | "corrected" | "positive" | "failure"
  content: string
  timestamp: string
}

function storagePath(): string {
  const dir = path.join(homedir(), ".config", "opencode", "supercharger")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return path.join(dir, STORAGE_FILE)
}

export function getLearnings(): Learning[] {
  try {
    const file = storagePath()
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, "utf8"))
    }
  } catch {}
  return []
}

export function addLearning(type: Learning["type"], content: string): void {
  try {
    const learnings = getLearnings()
    learnings.push({ type, content, timestamp: new Date().toISOString() })
    // Keep last 100 learnings
    const trimmed = learnings.slice(-100)
    writeFileSync(storagePath(), JSON.stringify(trimmed, null, 2))
  } catch {}
}

export function formatLearningsForPrompt(): string {
  const learnings = getLearnings()
  if (learnings.length === 0) return ""

  const lines = ["<learnings>"]
  for (const l of learnings.slice(-20)) {
    const icon = l.type === "blocked" ? "🚫" : l.type === "corrected" ? "✏️" : l.type === "positive" ? "✅" : "❌"
    lines.push(`${icon} ${l.content}`)
  }
  lines.push("</learnings>")
  return lines.join("\n")
}