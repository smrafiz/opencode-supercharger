#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-$(pwd)}"
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BOLD}OpenCode Supercharger Uninstaller${NC}"

# --- 1. Remove plugin from config ---
for CONFIG in "$TARGET_DIR/opencode.json" "$HOME/.config/opencode/opencode.json"; do
  [ -f "$CONFIG" ] || continue
  bun -e "
    const fs = require('fs');
    const content = fs.readFileSync('$CONFIG', 'utf8');
    const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const cfg = JSON.parse(clean);
    if (!cfg.plugin) { process.exit(0); }
    cfg.plugin = cfg.plugin.filter(p => !p.includes('opencode-supercharger'));
    if (cfg.plugin.length === 0) delete cfg.plugin;
    fs.writeFileSync('$CONFIG', JSON.stringify(cfg, null, 2) + '\n');
  " && echo -e "  ${GREEN}✓${NC} Removed plugin from $(basename $CONFIG)" || true
done

# --- 2. Remove agent/command config ---
bun -e "
  const fs = require('fs');
  const cfg = JSON.parse(fs.readFileSync('$TARGET_DIR/opencode.json', 'utf8').replace(/\/\/.*$/gm, ''));
  let changed = false;
  if (cfg.agent) { delete cfg.agent; changed = true; }
  if (cfg.command) { delete cfg.command; changed = true; }
  if (changed) fs.writeFileSync('$TARGET_DIR/opencode.json', JSON.stringify(cfg, null, 2) + '\n');
" && echo -e "  ${GREEN}✓${NC} Removed agent/command configs" || true

# --- 3. Remove skills ---
if [ -d "$TARGET_DIR/.opencode/skills" ]; then
  for skill_dir in "$SCRIPT_DIR/configs/skills/"*/; do
    skill_name=$(basename "$skill_dir")
    rm -rf "$TARGET_DIR/.opencode/skills/$skill_name" 2>/dev/null && echo -e "  ${GREEN}✓${NC} Removed $skill_name skill" || true
  done
fi

# --- 4. Remove rules ---
if [ -d "$TARGET_DIR/.opencode/rules" ]; then
  for rule_file in "$SCRIPT_DIR/configs/rules/"*.md; do
    rule_name=$(basename "$rule_file")
    rm -f "$TARGET_DIR/.opencode/rules/$rule_name" 2>/dev/null && echo -e "  ${GREEN}✓${NC} Removed $rule_name rule" || true
  done
fi

echo ""
echo -e "${GREEN}OpenCode Supercharger fully uninstalled.${NC}"
echo "  Restart OpenCode to complete removal."
