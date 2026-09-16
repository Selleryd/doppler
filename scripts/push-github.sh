#!/bin/bash
# Upload this reconstructed local Doppler project to selleryd/doppler.
# This script does NOT remove a CSS fade, export the ChatGPT Site, build the
# website, change GitHub Pages settings, or verify a production deployment.
# It overlays project files in a fresh clone, preserving remote history and
# files absent from the selected folder. It never uses --force or --delete.
set -Eeuo pipefail
set +x
umask 077

OWNER="selleryd"
REPO="doppler"
REPO_URL="https://github.com/${OWNER}/${REPO}.git"
TMP_WORK=""
CHECKOUT=""
DOPPLER_GH_PAT=""

cleanup() {
  unset DOPPLER_GH_PAT GIT_ASKPASS GIT_TERMINAL_PROMPT || true
  if [ -n "${TMP_WORK:-}" ] && [ -d "$TMP_WORK" ]; then
    rm -rf -- "$TMP_WORK"
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'rc=$?; printf "\nStopped. No force-push was attempted.\n" >&2; if [ -n "${CHECKOUT:-}" ]; then printf "Working copy retained at: %s\n" "$CHECKOUT" >&2; fi; exit "$rc"' ERR

if [ "${1:-}" = "--help" ]; then
  cat <<'HELP'
Usage: bash scripts/push-github.sh [path-to-reviewed-project-folder]

Without a folder argument, a macOS folder picker opens.
The script asks for a PAT with hidden input, verifies the GitHub account and
repository, clones into ~/Desktop/Doppler-GitHub-Uploads, and copies the selected
project files over that clone. Existing repository files absent from the
selected project are retained. Common secret/cache files are excluded.

Review the staged changes and type PUSH to commit and push to the repository's
current default branch. No force push, website build, CSS repair, or hosting
configuration is performed. A successful push does not verify that a site
has gone live. The PAT is not written to disk or put in the remote URL.
HELP
  exit 0
fi

for tool in git python3 rsync; do
  command -v "$tool" >/dev/null 2>&1 || {
    printf 'Required command not found: %s\n' "$tool" >&2
    exit 1
  }
done

printf '\nDoppler GitHub upload -> %s/%s\n' "$OWNER" "$REPO"
printf 'Uploading the reconstructed website packaged with this helper.\n'
printf 'Review its new page copy and indexing settings before publication.\n'
printf 'Existing GitHub workflows may run after a push. No hosting settings are changed here.\n\n'

if [ "$#" -gt 0 ]; then
  SOURCE="$1"
else
  command -v osascript >/dev/null 2>&1 || {
    printf 'Run again with the project-folder path as the first argument.\n' >&2
    exit 1
  }
  SOURCE="$(osascript -e 'POSIX path of (choose folder with prompt "Select the corrected Doppler PROJECT folder, not Downloads or Desktop")')"
fi
[ -d "$SOURCE" ] || { printf 'That project folder does not exist.\n' >&2; exit 1; }
SOURCE="$(cd -- "$SOURCE" && pwd -P)"
case "$SOURCE" in
  /|"$HOME"|"$HOME/Desktop"|"$HOME/Downloads"|"$HOME/Documents")
    printf 'Select the specific Doppler project folder, not a general folder.\n' >&2
    exit 1 ;;
esac
if [ ! -f "$SOURCE/index.html" ] && [ ! -f "$SOURCE/package.json" ]; then
  printf 'The selected folder has neither index.html nor package.json at its root.\n' >&2
  printf 'Nothing was uploaded. Select the actual website project root.\n' >&2
  exit 1
fi
printf 'Selected project: %s\n' "$SOURCE"
# Guard against accidentally selecting another website project.
python3 - "$SOURCE" <<'PY_SOURCE'
import os
from pathlib import Path
import sys

root = Path(sys.argv[1])
skip = {'.git', 'node_modules', '.next', '.cache', '.venv', 'venv', '__pycache__'}
text_types = {'.html', '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.json', '.md', '.css'}
for directory, dirs, names in os.walk(root, followlinks=False):
    dirs[:] = [d for d in dirs if d not in skip and not d.startswith('.')]
    for name in names:
        path = Path(directory) / name
        if path.suffix.lower() not in text_types or path.is_symlink():
            continue
        try:
            if path.stat().st_size <= 5 * 1024 * 1024 and b'doppler' in path.read_bytes().lower():
                print('Doppler project marker found: ' + str(path.relative_to(root)))
                raise SystemExit(0)
        except OSError:
            continue
raise SystemExit('No Doppler marker found in the project. Nothing was uploaded; select the Doppler website folder.')
PY_SOURCE

TMP_WORK="$(mktemp -d "${TMPDIR:-/tmp}/doppler-push.XXXXXX")"
# Read the terminal directly even when commands were pasted via a heredoc.
printf '\nPaste your GitHub PAT (hidden), then press Return: ' > /dev/tty
IFS= read -r -s DOPPLER_GH_PAT < /dev/tty
printf '\n' > /dev/tty
if [[ ! "$DOPPLER_GH_PAT" =~ ^[A-Za-z0-9_]+$ ]]; then
  printf 'Empty token or unexpected characters. Paste only the PAT and retry.\n' >&2
  exit 1
fi
export DOPPLER_GH_PAT

printf 'Verifying your GitHub account and repository access...\n'
python3 - "$TMP_WORK/metadata.json" "$OWNER" "$REPO" <<'PY'
import json
import os
import sys
import urllib.error
import urllib.request

output, owner, repo = sys.argv[1:]
token = os.environ['DOPPLER_GH_PAT']
headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Doppler-local-upload',
}

def get(path):
    request = urllib.request.Request('https://api.github.com' + path, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        messages = {
            401: 'GitHub rejected the PAT. Check that it is valid and not expired.',
            403: 'GitHub denied this request. Check token permissions, approval, and rate limits.',
            404: 'Repository not found or not accessible with this PAT. Select selleryd/doppler in token access.',
        }
        raise SystemExit(messages.get(exc.code, 'GitHub returned HTTP ' + str(exc.code)))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        raise SystemExit('Could not complete the GitHub access check. Check your connection and retry.')

user = get('/user')
if user.get('login', '').lower() != owner.lower():
    raise SystemExit('The PAT belongs to a different GitHub account. Use a PAT for ' + owner + '.')
metadata = get('/repos/' + owner + '/' + repo)
if metadata.get('full_name', '').lower() != (owner + '/' + repo).lower():
    raise SystemExit('Repository identity mismatch. Nothing was uploaded.')
if metadata.get('archived') or metadata.get('disabled'):
    raise SystemExit('The repository is archived or disabled. Nothing was uploaded.')
if metadata.get('permissions', {}).get('push') is False:
    raise SystemExit('This account does not have push permission for the repository.')
result = {
    'branch': metadata.get('default_branch') or 'main',
    'login': user['login'],
    'email': str(user['id']) + '+' + user['login'] + '@users.noreply.github.com',
}
with open(output, 'w', encoding='utf-8') as handle:
    json.dump(result, handle)
print('Verified GitHub account: ' + user['login'])
print('Target repository: ' + metadata['full_name'])
print('Target branch: ' + result['branch'])
PY

BRANCH="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["branch"])' "$TMP_WORK/metadata.json")"
COMMIT_EMAIL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["email"])' "$TMP_WORK/metadata.json")"
git check-ref-format "refs/heads/$BRANCH" >/dev/null

# This helper contains no token. It reads the token from process memory.
cat > "$TMP_WORK/askpass" <<'ASKPASS'
#!/bin/bash
set +x
case "$1" in
  *Username*|*username*) printf '%s\n' 'selleryd' ;;
  *Password*|*password*) printf '%s\n' "$DOPPLER_GH_PAT" ;;
  *) exit 1 ;;
esac
ASKPASS
chmod 700 "$TMP_WORK/askpass"
export GIT_ASKPASS="$TMP_WORK/askpass"
export GIT_TERMINAL_PROMPT=0
# Avoid credential tracing inherited from a debugging session.
unset GIT_TRACE GIT_TRACE_CURL GIT_CURL_VERBOSE GIT_TRACE_PACKET GIT_TRACE2 GIT_TRACE2_EVENT GIT_TRACE2_PERF || true

git_auth() {
  command git -c credential.helper= -c credential.username="$OWNER" \
    -c core.hooksPath=/dev/null "$@"
}

UPLOADS="$HOME/Desktop/Doppler-GitHub-Uploads"
mkdir -p "$UPLOADS"
CHECKOUT="$(mktemp -d "$UPLOADS/doppler-$(date +%Y%m%d-%H%M%S).XXXXXX")"
printf '\nCloning into a new folder: %s\n' "$CHECKOUT"
git_auth clone -- "$REPO_URL" "$CHECKOUT"
if git -C "$CHECKOUT" rev-parse --verify HEAD >/dev/null 2>&1; then
  CURRENT="$(git -C "$CHECKOUT" symbolic-ref --short HEAD)"
  [ "$CURRENT" = "$BRANCH" ] || {
    printf 'The default branch changed during preparation. Retry the script.\n' >&2
    exit 1
  }
else
  git -C "$CHECKOUT" symbolic-ref HEAD "refs/heads/$BRANCH"
fi

printf '\nCopying project files; preserving repository history and unmatched files...\n'
rsync -a --safe-links \
  --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='.cache' --exclude='.turbo' --exclude='.astro' \
  --exclude='.venv' --exclude='venv' --exclude='__pycache__' \
  --exclude='.env*' --exclude='.npmrc' --exclude='.pypirc' \
  --exclude='.netrc' --exclude='.ssh' --exclude='.aws' \
  --exclude='*.pem' --exclude='*.key' --exclude='*.p12' --exclude='*.pfx' \
  --exclude='credentials*.json' --exclude='service-account*.json' \
  --exclude='id_rsa*' --exclude='id_ed25519*' --exclude='.DS_Store' \
  --exclude='__MACOSX' --exclude='*.log' --exclude='*.pyc' --exclude='*.zip' \
  "$SOURCE/" "$CHECKOUT/"
git_auth -C "$CHECKOUT" add -A -- .

# Scan only newly staged/modified blobs, not the entire repository history.
python3 - "$CHECKOUT" <<'PY'
import re
import subprocess
import sys

root = sys.argv[1]
def git(*args):
    return subprocess.check_output(['git', '-C', root, *args])

patterns = (
    re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
    re.compile(rb'\bgithub_pat_[A-Za-z0-9_]{40,}\b'),
    re.compile(rb'-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----'),
)
paths = git('diff', '--cached', '--name-only', '--diff-filter=ACM', '-z').split(b'\0')
problems = []
for raw_path in filter(None, paths):
    path = raw_path.decode('utf-8', errors='surrogateescape')
    blob = ':' + path
    size = int(git('cat-file', '-s', blob))
    if size > 95 * 1024 * 1024:
        problems.append((path, 'file exceeds this script\'s 95 MiB safety limit'))
        continue
    content = git('cat-file', 'blob', blob)
    if any(pattern.search(content) for pattern in patterns):
        problems.append((path, 'possible access token or private key'))
if problems:
    for path, reason in problems:
        print('Blocked: ' + path + ' (' + reason + ')', file=sys.stderr)
    raise SystemExit('Nothing was pushed. Remove the flagged files/secrets from the source and retry.')
PY

if git -C "$CHECKOUT" diff --cached --quiet; then
  printf '\nNo file changes compared with GitHub. No commit or push is needed.\n'
  printf 'This does not verify the visual fix or live website deployment.\n'
  exit 0
fi

printf '\n=== FILES THAT WILL BE COMMITTED ===\n'
git -C "$CHECKOUT" status --short
printf '\n=== CHANGE SUMMARY ===\n'
git -C "$CHECKOUT" diff --cached --stat
printf '\nInspect the complete staged diff with:\n'
printf 'git -C %q diff --cached\n' "$CHECKOUT"
printf '\nTarget: %s/%s, branch %s\n' "$OWNER" "$REPO" "$BRANCH"
printf 'The source folder is unchanged. Common secrets are excluded, but review is still required.\n'
printf '\nType PUSH to commit these files and push, or press Return to cancel: ' > /dev/tty
IFS= read -r CONFIRM < /dev/tty
if [ "$CONFIRM" != "PUSH" ]; then
  printf 'Cancelled. Nothing was pushed.\nWorking copy retained: %s\n' "$CHECKOUT"
  exit 0
fi

git_auth -C "$CHECKOUT" -c user.name="$OWNER" -c user.email="$COMMIT_EMAIL" \
  -c commit.gpgsign=false commit -m "Add reconstructed Doppler website with clean pause section"
git_auth -C "$CHECKOUT" push origin "HEAD:refs/heads/$BRANCH"
COMMIT="$(git -C "$CHECKOUT" rev-parse HEAD)"
printf '\nGitHub push succeeded.\nRepository: %s/%s\nBranch: %s\nCommit: %s\n' \
  "$OWNER" "$REPO" "$BRANCH" "$COMMIT"
printf 'Local working copy: %s\n' "$CHECKOUT"
printf 'Website build, hosting configuration, and live deployment were not verified.\n'
