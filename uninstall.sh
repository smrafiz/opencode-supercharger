#!/bin/bash
set -e

PLUGIN_PATH="$(cd "$(dirname "$0")/src" && pwd)/index.ts"

for CONFIG in "./opencode.json" "$HOME/.config/opencode/opencode.json"; do
  [ -f "$CONFIG" ] || continue
  bun -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG', 'utf8'));
    if (!Array.isArray(cfg.plugin)) { console.log('No plugin array in $CONFIG'); process.exit(0); }
    cfg.plugin = cfg.plugin.filter(p => p !== '$PLUGIN_PATH');
    fs.writeFileSync('$CONFIG', JSON.stringify(cfg, null, 2) + '\n');
    console.log('Removed plugin from $CONFIG');
  "
done

echo "OpenCode Supercharger uninstalled."
