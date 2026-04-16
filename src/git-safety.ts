const BLOCKED_GIT: { pat: RegExp; msg: string }[] = [
  {
    pat: /git\s+push\s+(?:.*\s)?--force(?:-with-lease)?(?:\s+.*)?(?:origin\s+)?(main|master)/,
    msg: "force push to protected branch (main/master)",
  },
  {
    pat: /git\s+push\s+(?:.*\s)?(?:origin\s+)?(main|master)(?:\s+.*)?--force(?:-with-lease)?/,
    msg: "force push to protected branch (main/master)",
  },
  {
    pat: /git\s+reset\s+--hard/,
    msg: "git reset --hard destroys uncommitted work",
  },
  {
    pat: /git\s+checkout\s+--\s*\./,
    msg: "git checkout -- . discards all changes",
  },
  {
    pat: /git\s+restore\s+\./,
    msg: "git restore . discards all changes",
  },
  {
    pat: /git\s+clean\s+(?:.*-[a-zA-Z]*f|-f)/,
    msg: "git clean -f removes untracked files",
  },
  {
    pat: /git\s+branch\s+-D\s+(main|master)/,
    msg: "deleting protected branch (main/master)",
  },
  {
    pat: /git\s+stash\s+(drop|clear)/,
    msg: "git stash drop/clear permanently removes stashed changes",
  },
]

const WARN_GIT: { pat: RegExp; msg: string }[] = [
  {
    pat: /git\s+push\s+(?:.*\s)?--force(?:-with-lease)?/,
    msg: "force push to non-protected branch — verify this is intentional",
  },
]

export function checkGitCommand(cmd: string): { blocked: boolean; reason: string } | null {
  const n = cmd.trim().replace(/\s+/g, " ")

  for (const { pat, msg } of BLOCKED_GIT) {
    if (pat.test(n)) return { blocked: true, reason: msg }
  }

  for (const { pat, msg } of WARN_GIT) {
    if (pat.test(n)) {
      console.error(`[Supercharger] Git warning: ${msg}`)
    }
  }

  return null
}
