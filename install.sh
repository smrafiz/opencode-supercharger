#!/bin/bash
set -e

echo "Installing OpenCode Supercharger..."

PLUGIN_DIR="$HOME/.opencode/plugins/supercharger"
mkdir -p "$PLUGIN_DIR"

cp -r src/* "$PLUGIN_DIR/"

echo "Supercharger installed to $PLUGIN_DIR"
echo ""
echo "Configuration options:"
echo "1. Enable directly (if plugin is registered):"
echo '   "plugins": { "enable": ["supercharger"] }'
echo ""
echo "2. Or load from source:"
echo '   "plugins": { "sources": [{ "path": "/Users/srafiz/GithubProjects/opencode-supercharger/src", "recursive": true }] }'