#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
MAC_APP_DIR="$ROOT/mac-app"
BUILD_DIR="$ROOT/build"
APP_NAME="ComplianceCopilot"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
DMG_PATH="$BUILD_DIR/$APP_NAME.dmg"

echo "==> Building Swift app..."
cd "$MAC_APP_DIR"
swift build -c release

echo "==> Assembling .app bundle..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

cp "$MAC_APP_DIR/.build/release/$APP_NAME" "$APP_BUNDLE/Contents/MacOS/"
cp "$MAC_APP_DIR/Info.plist"               "$APP_BUNDLE/Contents/"

RESOURCES_SRC="$MAC_APP_DIR/Sources/$APP_NAME/Resources"
cp "$RESOURCES_SRC/docker-compose.yml" "$APP_BUNDLE/Contents/Resources/"
cp "$RESOURCES_SRC/.env.default"       "$APP_BUNDLE/Contents/Resources/"
cp "$RESOURCES_SRC/AppIcon.icns"       "$APP_BUNDLE/Contents/Resources/"

echo "==> Ad-hoc code signing..."
# Sign with '-' (ad-hoc identity) — free, no Apple Developer account needed.
# Eliminates the "damaged and can't be opened" error on macOS Ventura+.
codesign --deep --force --sign - "$APP_BUNDLE"

echo "==> Stripping quarantine attributes..."
xattr -c "$APP_BUNDLE" 2>/dev/null || true

echo "==> Creating DMG..."
mkdir -p "$BUILD_DIR"
rm -f "$DMG_PATH"
hdiutil create \
    -volname "$APP_NAME" \
    -srcfolder "$APP_BUNDLE" \
    -ov -format UDZO \
    "$DMG_PATH"

# Strip quarantine from the DMG itself too
xattr -cr "$DMG_PATH" 2>/dev/null || true

echo ""
echo "Done! DMG at: $DMG_PATH"
