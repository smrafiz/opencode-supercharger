import { existsSync } from "node:fs"
import path from "node:path"
const { join } = path

const PKG_RULES: {
  lock: string
  pat: RegExp
  manager: string
}[] = [
  {
    lock: "pnpm-lock.yaml",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "pnpm",
  },
  {
    lock: "yarn.lock",
    pat: /^npm\s+(install|ci|add|remove|update)\b/,
    manager: "yarn",
  },
  {
    lock: "bun.lockb",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "bun",
  },
  {
    lock: "bun.lock",
    pat: /^npm\s+(install|run|exec|ci|add|remove|update)\b/,
    manager: "bun",
  },
  {
    lock: "uv.lock",
    pat: /^pip\s+install\b/,
    manager: "uv",
  },
  {
    lock: "poetry.lock",
    pat: /^pip\s+install\b/,
    manager: "poetry",
  },
]

export function checkPackageManager(
  cmd: string,
  projectDir: string,
): { blocked: boolean; reason: string } | null {
  const n = cmd.trim().replace(/\s+/g, " ")

  for (const { lock, pat, manager } of PKG_RULES) {
    if (existsSync(join(projectDir, lock)) && pat.test(n)) {
      return {
        blocked: true,
        reason: `project uses ${manager} (found ${lock}), not npm — use ${manager} instead`,
      }
    }
  }

  return null
}
