#!/usr/bin/env bash
# Build the demo site and push it to the Codeberg Pages branch.
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
git commit -m "Deploy fwtoolkit demo to Codeberg Pages"

REMOTE=$(cd "$ROOT" && git remote get-url origin)
echo "Pushing to $REMOTE pages branch..."
git remote add origin "$REMOTE"
git push -f origin pages

cd "$ROOT"
rm -rf "$BUILD_DIR"
echo "Done. The demo should be available at https://fiduswriter.codeberg.page/fwtoolkit/"
