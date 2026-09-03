#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install TypeScript language server for JS/TS code intelligence
if ! command -v typescript-language-server &>/dev/null; then
  npm install -g typescript-language-server typescript
fi

# Install Pyright for Python code intelligence
if ! command -v pyright &>/dev/null; then
  pip install pyright --quiet
fi
