#!/usr/bin/env bash
# Build the demo site and push it to the Forgejo Pages branch.
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "Building fwtoolkit..."
npm run build

echo "Preparing pages build..."
BUILD_DIR="$ROOT/.pages-build"
rm -rf "$BUILD_DIR"
mkdir "$BUILD_DIR"

cp -r "$ROOT/demo/"* "$BUILD_DIR/"
cp -r "$ROOT/dist" "$BUILD_DIR/"
cp -r "$ROOT/css" "$BUILD_DIR/"

# Copy Font Awesome assets locally so the demo does not rely on external CDNs.
mkdir -p "$BUILD_DIR/fontawesome"
cp -r "$ROOT/node_modules/@fortawesome/fontawesome-free/css" "$BUILD_DIR/fontawesome/"
cp -r "$ROOT/node_modules/@fortawesome/fontawesome-free/webfonts" "$BUILD_DIR/fontawesome/"

cd "$BUILD_DIR"
git init
git checkout -b pages
git add .
# A committer identity is required when running in CI (fresh runner image).
git config user.name "CI"
git config user.email "ci@fiduswriter.org"
git commit -m "Deploy fwtoolkit demo to Forgejo Pages"

# Prefer the HTTPS push URL passed from CI (org-level PAGES_TOKEN); fall back
# to the locally configured SSH remote for manual deploys.
if [ -n "${PAGES_REMOTE:-}" ]; then
    REMOTE="$PAGES_REMOTE"
    echo "Pushing to pages branch via CI token..."
else
    REMOTE=$(cd "$ROOT" && git remote get-url origin)
    echo "Pushing to $REMOTE pages branch..."
fi
git remote add origin "$REMOTE"
git push -f origin pages

cd "$ROOT"
rm -rf "$BUILD_DIR"
echo "Done. The demo should be available at https://fiduswriter.pages.fiduswriter.org/fwtoolkit/"
