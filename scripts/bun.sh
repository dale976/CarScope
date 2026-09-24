#!/bin/sh
# Prefer the project-local runtime; fall back to Bun installed on PATH.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if [ -x .tools/bun ]; then
  PATH="$PWD/.tools:$PATH"
  export PATH
fi
if ! command -v bun >/dev/null 2>&1; then
  echo 'Bun was not found. Install Bun or configure your IDE to use .tools/bun.' >&2
  exit 1
fi
exec bun "$@"
