import { CRED_PATTERNS } from "./safety.ts"

export function scanOutput(output: string): boolean {
  for (const pat of CRED_PATTERNS) {
    if (pat.test(output)) {
      console.error("[Supercharger] WARNING: possible secret/credential detected in tool output")
      return true
    }
  }
  return false
}
