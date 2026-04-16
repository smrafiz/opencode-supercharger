#!/bin/bash
set -e

PLUGIN_PATH="$(cd "$(dirname "$0")/src" && pwd)/index.ts"

# Locate opencode.json
if [ -f "./opencode.json" ]; then
  CONFIG="./opencode.json"
elif [ -f "$HOME/.config/opencode/opencode.json" ]; then
  CONFIG="$HOME/.config/opencode/opencode.json"
else
  CONFIG="./opencode.json"
fi

if [ -f "$CONFIG" ]; then
  # Add plugin path to existing file using node/bun inline script
  bun -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG', 'utf8'));
    cfg.plugin = cfg.plugin || [];
    if (!cfg.plugin.includes('$PLUGIN_PATH')) {
      cfg.plugin.push('$PLUGIN_PATH');
      fs.writeFileSync('$CONFIG', JSON.stringify(cfg, null, 2) + '\n');
      console.log('Added plugin to $CONFIG');
    } else {
      console.log('Plugin already registered in $CONFIG');
    }
  "
else
  printf '{\n  "plugin": ["%s"]\n}\n' "$PLUGIN_PATH" > "$CONFIG"
  echo "Created $CONFIG with plugin entry"
fi

echo "OpenCode Supercharger installed."
