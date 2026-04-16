import { existsSync, mkdirSync, appendFileSync, readdirSync, unlinkSync, statSync } from "node:fs"
import path from "node:path"
const { join, basename } = path
import { homedir } from "node:os"

export interface AuditEntry {
  tool: string
  args: string
  blocked?: boolean
  reason?: string
}

const CRED_REDACT: RegExp[] = [
  /([Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=\s*)[^\s&"']+/g,
  /([Ss][Ee][Cc][Rr][Ee][Tt][_-]?[Kk][Ee][Yy]\s*=\s*)[^\s&"']+/g,
  /(AKIA)[0-9A-Z]{16}/g,
  /(ghp_)[a-zA-Z0-9]{36}/g,
  /(sk-)[a-zA-Z0-9]{48}/g,
  /(AIza)[0-9A-Za-z_-]{35}/g,
  /([Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=\s*)[^\s&"']+/g,
  /(eyJ[a-zA-Z0-9_-]{10,})\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
]

function redact(s: string): string {
  let out = s
  for (const pat of CRED_REDACT) {
    out = out.replace(pat, (_, prefix) => `${prefix}[REDACTED]`)
  }
  return out
}

function auditDir(): string {
  return join(homedir(), ".config", "opencode", "supercharger", "audit")
}

function todayFile(): string {
  const d = new Date().toISOString().slice(0, 10)
  return join(auditDir(), `${d}.jsonl`)
}

function ensureDir(): void {
  const dir = auditDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function logEvent(entry: AuditEntry): void {
  try {
    ensureDir()
    const record = {
      timestamp: new Date().toISOString(),
      tool: entry.tool,
      args_preview: redact(entry.args.slice(0, 100)),
      ...(entry.blocked !== undefined ? { blocked: entry.blocked } : {}),
      ...(entry.reason ? { reason: entry.reason } : {}),
    }
    appendFileSync(todayFile(), JSON.stringify(record) + "\n", "utf8")
  } catch {
    // audit failures must never crash the plugin
  }
}

export function rotateAudit(): void {
  try {
    const dir = auditDir()
    if (!existsSync(dir)) return
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".jsonl")) continue
      const full = join(dir, file)
      try {
        const { mtimeMs } = statSync(full)
        if (mtimeMs < cutoff) unlinkSync(full)
      } catch {
        // skip files we can't stat/delete
      }
    }
  } catch {
    // rotation failures must never crash the plugin
  }
}
