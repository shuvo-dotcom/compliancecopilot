#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-dev}"
echo "Building ComplianceCopilot DMG v${VERSION}"

cd mac-app
xcodebuild -scheme ComplianceCopilot -configuration Release \
  -archivePath build/ComplianceCopilot.xcarchive archive

xcodebuild -exportArchive \
  -archivePath build/ComplianceCopilot.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist

create-dmg \
  --volname "ComplianceCopilot" \
  --window-size 600 400 \
  --icon-size 100 \
  --app-drop-link 450 200 \
  "../ComplianceCopilot-${VERSION}.dmg" \
  "build/export/ComplianceCopilot.app"

echo "Built: ComplianceCopilot-${VERSION}.dmg"
