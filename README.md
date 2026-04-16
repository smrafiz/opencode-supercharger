# OpenCode Supercharger

**Shell-level guardrails for OpenCode. Install once, forget forever.**

---

## The problem

OpenCode is powerful enough to delete your database, force-push to main, or pipe a shell script from the internet. Nothing in the default config stops it. This plugin does.

## Install

Add one line to your `opencode.json`:

```json
{
  "plugins": ["@opencode-supercharger/plugin"]
}
```

That's it. Every session is protected from that point on.

---

## What you get

- **Destructive command blocking** — `rm -rf /`, `DROP TABLE`, `dd if=`, `mkfs`, fork bombs, and pipe-to-shell one-liners are blocked before they run
- **Git guardrails** — force-pushes to `main`/`master`, `git reset --hard`, `git clean -f`, and branch deletion are blocked outright
- **Secret detection** — AWS keys, GitHub tokens, OpenAI keys, private keys, and JWTs are caught in both commands and tool output
- **Code security scanning** — every `edit` and `write` is scanned for injection risks, weak crypto, hardcoded credentials, and obfuscation patterns
- **Loop detection** — if the same tool call repeats 3 times in 30 seconds, you get a warning before the model burns through tokens on a dead end
- **Audit trail** — every tool call is logged to `~/.config/opencode/supercharger/audit/` in JSONL format, with credentials auto-redacted; logs older than 30 days are pruned automatically

---

## What gets blocked

| Category | Examples |
|---|---|
| Destructive shell | `rm -rf /`, `rm -rf ~`, `mkfs.*`, `dd if=` |
| Pipe-to-shell | `curl ... \| bash`, `wget ... \| bash`, `base64 ... \| bash` |
| SQL | `DROP TABLE`, `DROP DATABASE` |
| Permissions | `chmod 777` |
| Process | `kill -9 -1`, `eval` |
| Credentials in commands | AWS keys, `ghp_` tokens, `sk-` keys, `PASSWORD=` |
| Clipboard access | `pbpaste`, `pbcopy`, `xclip`, `wl-paste` |
| Sensitive paths | Keychain, Signal DB, 1Password, `.password-store` |
| Browser data | Chrome, Firefox, Arc, Brave, Edge profile directories |
| Shell history | `.bash_history`, `.zsh_history`, `.psql_history` |
| SSH key operations | `ssh-keygen`, `ssh-add`, `ssh-copy-id` |
| Crontab modification | `crontab -e`, `crontab -` |
| Shell profile writes | `>> ~/.bashrc`, `>> ~/.zshrc` |
| Git (hard block) | Force-push to `main`/`master`, `reset --hard`, `clean -f`, `branch -D main` |
| Git (soft block) | `git stash drop`, `git stash clear` |
| Self-modification | Writing to `opencode.json` or `.opencode/settings` |
| Package manager mismatch | Running `npm install` in a `pnpm`/`yarn`/`bun`/`uv`/`poetry` project |

---

## Code security scanner

Every file write and edit is scanned before it lands on disk. Warnings print to stderr — the write still completes, but you'll know.

**JavaScript / TypeScript**
- `eval()`, `new Function()` — code injection
- `.innerHTML =`, `dangerouslySetInnerHTML`, `document.write()` — XSS

**Python**
- `pickle.load()` — unsafe deserialization
- `exec()`, `compile()`, `__import__()` — code execution
- `os.system()`, `subprocess(..., shell=True)` — shell injection

**SQL**
- f-string SQL queries
- String-concatenated SQL queries

**Secrets in code**
- Hardcoded `password =`, `secret =`, `api_key =`

**Weak crypto**
- `crypto.createHash('md5')`, `hashlib.md5()`

**GitHub Actions** (`.yml`/`.yaml` only)
- Unsanitized `${{ github.event.* }}` expressions

**Obfuscation**
- `atob()`, `btoa()`, `base64_decode()`, `b64decode()`
- Zero-width unicode characters (U+200B, U+200C, U+200D, U+FEFF, U+2060)
- Shell metacharacters in file paths (`$`, `` ` ``, `;`, `|`, `&&`)

---

## Loop detection

When the model gets stuck, it repeats. The same tool call with the same arguments three times in 30 seconds triggers a warning:

```
[Supercharger] LOOP: same tool+args repeated 3x in 30s — try a different approach
```

The call still runs. The warning gives you — and the model — a signal to change strategy before the session burns through tokens on the same failing approach.

---

## Audit trail

Every tool execution is appended to a daily JSONL file:

```
~/.config/opencode/supercharger/audit/2026-04-16.jsonl
```

Each record includes a timestamp, tool name, a truncated args preview, and — for blocked calls — the reason. Credentials are redacted before they hit disk. Files older than 30 days are deleted automatically at session start.

---

## Config scan

At the start of every session, the plugin scans your project's config files for prompt injection attempts:

- `CLAUDE.md`, `AGENTS.md` in the project root
- Any `.md` files inside `.opencode/`

Patterns caught include "ignore previous instructions", "you are now", "jailbreak", ChatML delimiters (`<|im_start|>`), Llama delimiters (`[INST]`, `<<SYS>>`), and base64-encoded variants of those phrases.

---

## Installation options

**Quick install** (clone + auto-setup):

```bash
git clone https://github.com/smrafiz/opencode-supercharger.git && cd opencode-supercharger && bash install.sh
```

**One-liner** (temp clone, auto-clean):

```bash
bash -c 'TMP=$(mktemp -d) && git clone https://github.com/smrafiz/opencode-supercharger.git "$TMP/ocs" && bash "$TMP/ocs/install.sh" "$(pwd)" && rm -rf "$TMP"'
```

**npm only** (plugin without skills/rules):

```json
{
  "plugin": ["opencode-supercharger"]
}
```

---

## Configuration

OpenCode's built-in `permissions` block controls file and tool allowlists. This plugin works alongside it — `permissions` handles access scope, Supercharger handles command-level safety. No plugin configuration is required. All rules are active by default.

A reasonable starting point:

```json
{
  "plugins": ["@opencode-supercharger/plugin"],
  "permissions": {
    "bash": true,
    "computer": false
  }
}
```

---

## Agents

Nine specialist agents are available in `configs/agents.json`. Merge the `"agent"` block into your `opencode.json`:

```json
{
  "plugins": ["@opencode-supercharger/plugin"],
  "agent": {
    // paste contents of configs/agents.json "agent" block here
  }
}
```

| Agent | Mode | Use for |
|---|---|---|
| `engineer` | subagent | Writing, fixing, or improving code |
| `debugger` | subagent | Root-cause analysis — reports findings, does not fix |
| `reviewer` | subagent | Code review with structured severity report (read-only) |
| `writer` | subagent | Blog posts, docs, emails, READMEs |
| `architect` | subagent | Design plans before building — no implementation code |
| `planner` | subagent | Task breakdown and sequencing — no implementation code |
| `researcher` | subagent | Research, comparisons, explanations |
| `analyst` | subagent | Data analysis, SQL, metrics, reports |
| `generalist` | primary | Default — general questions and tasks |

Invoke any agent by name in your prompt: `@engineer fix the auth bug` or `@reviewer review this PR`.

---

## Commands

Six slash commands are available in `configs/commands.json`. Merge the `"command"` block into your `opencode.json`:

```json
{
  "command": {
    // paste contents of configs/commands.json "command" block here
  }
}
```

| Command | Use for |
|---|---|
| `/think <problem>` | Structured 5-step reasoning for ambiguous problems |
| `/challenge <decision>` | Adversarial stress-test — assumptions, failure modes, critics |
| `/refactor <target>` | Code quality sweep — complexity, duplication, naming, coupling |
| `/audit <target>` | Consistency sweep — naming, style, docs, contracts, error handling |
| `/test <target>` | Generate unit tests covering happy path, edge cases, errors |
| `/doc <target>` | Generate documentation with usage examples |

---

## Rules

Ready-to-use instruction files live in `configs/rules/`. Add them to the `"instructions"` array in your `opencode.json`:

```json
{
  "instructions": [
    "configs/rules/guardrails.md",
    "configs/rules/economy-lean.md",
    "configs/rules/developer.md"
  ]
}
```

| File | What it does |
|---|---|
| `guardrails.md` | Four laws: read before edit, stay in scope, verify before commit, halt when uncertain |
| `economy-lean.md` | Lean output mode — every word earns its place, no ceremony |
| `economy-minimal.md` | Minimal output mode — telegraphic, bare deliverables only |
| `developer.md` | Developer role rules — code output, workflow, git, conventions |

---

## Example config

`configs/opencode.example.json` is a complete working config that combines the plugin, agents, commands, and rules. Copy it to your project root as `opencode.json` and adjust to taste.

---

## FAQ

<details>
<summary>Will this break my normal workflow?</summary>

Unlikely. The blocks target commands that are almost never part of a legitimate AI coding task — filesystem nukes, pipe-to-shell installs, raw disk writes. Everything else runs normally. If you hit a false positive, open an issue with the command and context.

</details>

<details>
<summary>Can the AI disable or modify this plugin?</summary>

No. Writing to `opencode.json` or `.opencode/settings` is blocked. The plugin cannot uninstall itself, and the AI cannot modify the rules at runtime.

</details>

<details>
<summary>Where are the audit logs stored?</summary>

`~/.config/opencode/supercharger/audit/YYYY-MM-DD.jsonl` — one file per day, pruned after 30 days. Credentials are redacted before writing. The log will never contain a raw API key or password.

</details>

<details>
<summary>Does this work with every package manager?</summary>

Yes. The plugin detects your lockfile and blocks the wrong package manager automatically. `pnpm-lock.yaml` present means `npm install` is blocked. Same logic applies for yarn, bun, uv, and poetry.

</details>

---

## Credits

OpenCode Supercharger is a port of [Claude Supercharger](https://github.com/smrafiz/claude-supercharger) — a guardrails and productivity layer originally built for Claude Code. The safety patterns, audit system, loop detector, and config scanner are adapted directly from that project.

---

## License

MIT
