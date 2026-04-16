import { existsSync } from "node:fs"

const DESTRUCTIVE: { pat: RegExp; msg: string }[] = [
  { pat: /rm\s+-rf\s+(\/|~|\$HOME|\.\.)/, msg: "recursive force rm on dangerous target" },
  { pat: /DROP\s+TABLE/i, msg: "DROP TABLE is destructive" },
  { pat: /DROP\s+DATABASE/i, msg: "DROP DATABASE is destructive" },
  { pat: /chmod\s+-?R?\s*777/, msg: "chmod 777 is insecure" },
  { pat: /mkfs\./, msg: "filesystem creation command" },
  { pat: /\bdd\s+if=/, msg: "dd with raw input" },
  { pat: />\s*\/dev\/sd/, msg: "direct disk write" },
  { pat: /curl[^|]*\|\s*(ba)?sh/, msg: "pipe-to-shell execution" },
  { pat: /wget[^|]*\|\s*(ba)?sh/, msg: "pipe-to-shell execution" },
  { pat: /:\(\)\s*\{.*:\s*\|.*:\s*\}\s*;/, msg: "fork bomb" },
  { pat: /kill\s+-9\s+-1/, msg: "kill -9 -1 kills all processes" },
  { pat: /\beval\s+/, msg: "eval execution" },
  { pat: /base64\s+.*\|\s*(ba)?sh/, msg: "base64 pipe-to-shell" },
  { pat: /echo\s+.*\|\s*base64\s+-d.*\|\s*(ba)?sh/, msg: "base64 decode pipe-to-shell" },
]

const CRED_PATTERNS: RegExp[] = [
  /[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=/,
  /[Ss][Ee][Cc][Rr][Ee][Tt][_-]?[Kk][Ee][Yy]\s*=/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{48}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]\s*=/,
  /-----BEGIN\s+.*PRIVATE KEY-----/,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
]

const CLIPBOARD_PATTERNS: RegExp[] = [
  /\bpbpaste\b|\bpbcopy\b/,
  /\bxclip\b|\bxsel\b/,
  /\bwl-paste\b|\bwl-copy\b/,
]

const SENSITIVE_PATHS: RegExp[] = [
  /Library\/Keychains/,
  /Library\/Messages/,
  /Signal\/sql/,
  /\.1password/,
  /gnome-keyring/,
  /\.password-store/,
  /\/Cookies$/,
  /\/Login\s+Data$/,
]

const BROWSER_DATA: RegExp[] = [
  /Application\s+Support\/Google\/Chrome/,
  /Application\s+Support\/Arc/,
  /\.mozilla\/firefox/i,
  /Application\s+Support\/Firefox/,
  /Application\s+Support\/BraveSoftware/,
  /Application\s+Support\/Microsoft\s+Edge/,
  /\/History$/,
]

const SHELL_HISTORY: RegExp[] = [
  /\.bash_history/,
  /\.zsh_history/,
  /\.python_history/,
  /\.psql_history/,
  /\.mysql_history/,
  /\.node_repl_history/,
]

const SSH_OPS: RegExp[] = [
  /\bssh-keygen\b/,
  /\bssh-add\b/,
  /\bssh-copy-id\b/,
]

const CRONTAB_MOD: RegExp[] = [
  /\bcrontab\s+-e\b/,
  /\bcrontab\s+-\b/,
]

const SHELL_PROFILE_MOD: RegExp[] = [
  />>\s*~\/\.bashrc/,
  />>\s*~\/\.zshrc/,
  />>\s*~\/\.profile/,
]

const SELF_MOD: RegExp[] = [
  /\.opencode\/settings/,
  /opencode\.json/,
]

export { CRED_PATTERNS }

export function checkCommand(cmd: string): { blocked: boolean; reason: string } | null {
  const n = cmd.trim().replace(/\s+/g, " ")

  for (const { pat, msg } of DESTRUCTIVE) {
    if (pat.test(n)) return { blocked: true, reason: msg }
  }
  for (const pat of CRED_PATTERNS) {
    if (pat.test(n)) return { blocked: true, reason: "credential pattern in command" }
  }
  for (const pat of CLIPBOARD_PATTERNS) {
    if (pat.test(n)) return { blocked: true, reason: "clipboard access" }
  }
  for (const pat of SENSITIVE_PATHS) {
    if (pat.test(n)) return { blocked: true, reason: "sensitive path access" }
  }
  for (const pat of BROWSER_DATA) {
    if (pat.test(n)) return { blocked: true, reason: "browser data access" }
  }
  for (const pat of SHELL_HISTORY) {
    if (pat.test(n)) return { blocked: true, reason: "shell history access" }
  }
  for (const pat of SSH_OPS) {
    if (pat.test(n)) return { blocked: true, reason: "SSH key operation" }
  }
  for (const pat of CRONTAB_MOD) {
    if (pat.test(n)) return { blocked: true, reason: "crontab modification" }
  }
  for (const pat of SHELL_PROFILE_MOD) {
    if (pat.test(n)) return { blocked: true, reason: "shell profile modification" }
  }

  // Self-modification: only block on write operations
  if (/\b(write|echo|tee|cat\s*>|sed\s+-i)\b/.test(n)) {
    for (const pat of SELF_MOD) {
      if (pat.test(n)) return { blocked: true, reason: "self-modification of opencode config" }
    }
  }

  return null
}
