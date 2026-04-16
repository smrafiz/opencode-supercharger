import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
const { join } = path

const INJECTION_PATTERNS: { pat: RegExp; msg: string }[] = [
  { pat: /ignore\s+previous\s+instructions/i, msg: "prompt injection: 'ignore previous instructions'" },
  { pat: /you\s+are\s+now\b/i, msg: "prompt injection: 'you are now'" },
  { pat: /system\s+prompt/i, msg: "prompt injection: 'system prompt'" },
  { pat: /\bdisregard\b/i, msg: "prompt injection: 'disregard'" },
  { pat: /\bjailbreak\b/i, msg: "prompt injection: 'jailbreak'" },
  { pat: /<\|im_start\|>/, msg: "prompt injection: ChatML delimiter" },
  { pat: /\[INST\]/, msg: "prompt injection: Llama instruction delimiter" },
  { pat: /<<SYS>>/, msg: "prompt injection: Llama system delimiter" },
  // Base64-encoded injection fragments: "ignore" and "system"
  { pat: /aWdub3JlI/, msg: "possible base64-encoded prompt injection (ignore...)" },
  { pat: /c3lzdGVtI/, msg: "possible base64-encoded prompt injection (system...)" },
]

function scanFile(filePath: string): string[] {
  const warnings: string[] = []
  try {
    const content = readFileSync(filePath, "utf8")
    for (const { pat, msg } of INJECTION_PATTERNS) {
      if (pat.test(content)) {
        warnings.push(`${filePath}: ${msg}`)
      }
    }
  } catch {
    // unreadable file — skip
  }
  return warnings
}

export function scanConfigFiles(projectDir: string): string[] {
  const warnings: string[] = []

  // Top-level config files
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const p = join(projectDir, name)
    if (existsSync(p)) warnings.push(...scanFile(p))
  }

  // .opencode/*.md
  const opencodeDir = join(projectDir, ".opencode")
  if (existsSync(opencodeDir)) {
    try {
      for (const entry of readdirSync(opencodeDir)) {
        if (entry.endsWith(".md")) {
          warnings.push(...scanFile(join(opencodeDir, entry)))
        }
      }
    } catch {
      // skip unreadable dir
    }
  }

  return warnings
}
