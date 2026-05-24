#!/usr/bin/env bash
# Build and push web + api images to GitHub Container Registry.
# Run this once before distributing the DMG.
#
# Usage:
#   ./scripts/push-images.sh           # pushes :latest
#   ./scripts/push-images.sh v1.0.0   # pushes :v1.0.0 AND :latest
set -euo pipefail

OWNER="shuvo-dotcom"
TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "==> Logging in to ghcr.io (you'll need a GitHub PAT with write:packages scope)"
echo "    Run: echo YOUR_PAT | docker login ghcr.io -u $OWNER --password-stdin"
echo ""

# Build & push web
echo "==> Building web image..."
docker build \
    --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
    -t "ghcr.io/$OWNER/compliancecopilot-web:$TAG" \
    "$ROOT/apps/web"

if [ "$TAG" != "latest" ]; then
    docker tag "ghcr.io/$OWNER/compliancecopilot-web:$TAG" \
               "ghcr.io/$OWNER/compliancecopilot-web:latest"
fi

echo "==> Pushing web image..."
docker push "ghcr.io/$OWNER/compliancecopilot-web:$TAG"
[ "$TAG" != "latest" ] && docker push "ghcr.io/$OWNER/compliancecopilot-web:latest"

# Build & push api
echo "==> Building api image..."
docker build \
    -t "ghcr.io/$OWNER/compliancecopilot-api:$TAG" \
    "$ROOT/apps/api"

if [ "$TAG" != "latest" ]; then
    docker tag "ghcr.io/$OWNER/compliancecopilot-api:$TAG" \
               "ghcr.io/$OWNER/compliancecopilot-api:latest"
fi

echo "==> Pushing api image..."
docker push "ghcr.io/$OWNER/compliancecopilot-api:$TAG"
[ "$TAG" != "latest" ] && docker push "ghcr.io/$OWNER/compliancecopilot-api:latest"

echo ""
echo "Done! Images published:"
echo "  ghcr.io/$OWNER/compliancecopilot-web:$TAG"
echo "  ghcr.io/$OWNER/compliancecopilot-api:$TAG"
echo ""
echo "Now run: bash scripts/build-dmg.sh"
