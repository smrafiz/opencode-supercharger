# OpenCode Supercharger

Claude Supercharger-style safety, auditing, and optimization for OpenCode.

## Features

- **Safety** - Block destructive commands (rm -rf /, DROP TABLE, credentials)
- **Git Safety** - Block force push, reset --hard, branch deletion
- **Code Security** - Warn on eval(), XSS, SQL injection patterns
- **Package Manager** - Enforce pnpm/yarn/bun/uv based on lockfile
- **Audit** - Track all tool executions
- **Loop Detection** - Warn on repeated tool calls

## Installation

```bash
cd /Users/srafiz/GithubProjects/opencode-supercharger
bash install.sh
```

## Configuration

Add to your OpenCode config (`~/.opencode/config.jsonc`):

```jsonc
{
  "plugins": {
    "enable": ["supercharger"],
  },
}
```

Or load from source:

```jsonc
{
  "plugins": {
    "sources": [
      {
        "path": "/Users/srafiz/GithubProjects/opencode-supercharger/src",
        "recursive": true,
      },
    ],
  },
}
```

## Hooks

| Hook                  | When                  | Action                   |
| --------------------- | --------------------- | ------------------------ |
| `tool.execute.before` | Before tool execution | Block dangerous commands |
| `tool.execute.after`  | After tool execution  | Audit + secrets scan     |
| `session.created`     | Session starts        | Initialize               |
| `session.deleted`     | Session ends          | Log summary              |

## Blocked Patterns

### Destructive Commands

- `rm -rf /`, `rm -rf ~`, `rm -rf ..`
- `DROP TABLE`, `DROP DATABASE`
- `chmod 777`, `chmod -R 777`
- `curl | bash`, `wget | sh`
- Fork bombs, `dd` with raw input

### Git Safety

- Force push to main/master
- `git reset --hard`
- `git checkout -- .`
- `git clean -f`
- `git stash drop/clear`

### Package Manager

| Lockfile       | Blocks       |
| -------------- | ------------ |
| pnpm-lock.yaml | npm commands |
| yarn.lock      | npm commands |
| bun.lock       | npm commands |
| uv.lock        | pip install  |
| poetry.lock    | pip install  |

### Code Security (warnings)

- `eval()`, `new Function()`
- `.innerHTML =`, `dangerouslySetInnerHTML`
- `document.write()`
- `pickle.load()`, `exec()`, `os.system()`
- f-string SQL queries

### Credentials (blocks + detects in output)

- AWS keys: `AKIA...`
- GitHub tokens: `ghp_...`
- API keys, secrets in commands

## Uninstall

```bash
bash uninstall.sh
```

## License

MIT
