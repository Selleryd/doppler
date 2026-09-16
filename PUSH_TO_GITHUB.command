#!/bin/bash
# Uses THIS extracted website folder. No folder picker or guessed path.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
exec /bin/bash "$ROOT/scripts/push-github.sh" "$ROOT"
