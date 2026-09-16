#!/bin/bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
command -v python3 >/dev/null 2>&1 || {
  printf 'Python 3 was not found. Open index.html directly in your browser instead.\n'
  exit 1
}
exec python3 "$ROOT/src/serve.py"
