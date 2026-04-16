#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-$(pwd)}"
BOLD='\033[1m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BOLD}OpenCode Supercharger Installer${NC}"
echo -e "  Target: $TARGET_DIR"
echo ""

# --- 1. Locate or create opencode.json ---
if [ -f "$TARGET_DIR/opencode.json" ]; then
  CONFIG="$TARGET_DIR/opencode.json"
elif [ -f "$TARGET_DIR/opencode.jsonc" ]; then
  CONFIG="$TARGET_DIR/opencode.jsonc"
elif [ -f "$HOME/.config/opencode/opencode.json" ]; then
  CONFIG="$HOME/.config/opencode/opencode.json"
else
  CONFIG="$TARGET_DIR/opencode.json"
fi

# --- 2. Add plugin to config ---
if [ -f "$CONFIG" ]; then
  if grep -q "opencode-supercharger" "$CONFIG" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Plugin already registered in $CONFIG"
  else
    bun -e "
      const fs = require('fs');
      let raw = fs.readFileSync('$CONFIG', 'utf8');
      let clean = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const cfg = JSON.parse(clean);
      cfg.plugin = cfg.plugin || [];
      cfg.plugin.push('opencode-supercharger');
      fs.writeFileSync('$CONFIG', JSON.stringify(cfg, null, 2) + '\n');
    " 2>/dev/null && echo -e "  ${GREEN}✓${NC} Plugin added to $CONFIG" || {
      echo "  Could not auto-add plugin. Add manually: \"plugin\": [\"opencode-supercharger\"]"
    }
  fi
else
  printf '{\n  "$schema": "https://opencode.ai/config.json",\n  "plugin": ["opencode-supercharger"]\n}\n' > "$CONFIG"
  echo -e "  ${GREEN}✓${NC} Created $CONFIG with plugin"
fi

# --- 3. Copy skills ---
SKILLS_DIR="$TARGET_DIR/.opencode/skills"
mkdir -p "$SKILLS_DIR"
SKILL_COUNT=0
for skill_dir in "$SCRIPT_DIR/configs/skills/"*/; do
  skill_name=$(basename "$skill_dir")
  if [ ! -d "$SKILLS_DIR/$skill_name" ]; then
    cp -r "$skill_dir" "$SKILLS_DIR/$skill_name"
    SKILL_COUNT=$((SKILL_COUNT + 1))
  fi
done
if [ "$SKILL_COUNT" -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} ${SKILL_COUNT} skill(s) installed to .opencode/skills/"
else
  echo -e "  ${GREEN}✓${NC} Skills already installed"
fi

# --- 4. Copy rules ---
RULES_DIR="$TARGET_DIR/.opencode/rules"
mkdir -p "$RULES_DIR"
RULE_COUNT=0
for rule_file in "$SCRIPT_DIR/configs/rules/"*.md; do
  rule_name=$(basename "$rule_file")
  if [ ! -f "$RULES_DIR/$rule_name" ]; then
    cp "$rule_file" "$RULES_DIR/$rule_name"
    RULE_COUNT=$((RULE_COUNT + 1))
  fi
done
if [ "$RULE_COUNT" -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} ${RULE_COUNT} rule(s) installed to .opencode/rules/"
  echo ""
  echo -e "  ${BOLD}Add rules to your config:${NC}"
  echo '  "instructions": [".opencode/rules/guardrails.md", ".opencode/rules/economy-lean.md", ".opencode/rules/developer.md"]'
else
  echo -e "  ${GREEN}✓${NC} Rules already installed"
fi

# --- 5. Show commands info ---
echo ""
echo -e "  ${BOLD}Optional:${NC} Merge configs/commands.json into your opencode.json \"command\" section"
echo -e "  Available: /think, /challenge, /refactor, /audit, /test, /doc"

echo ""
echo -e "${GREEN}Done!${NC} Restart OpenCode to activate."
