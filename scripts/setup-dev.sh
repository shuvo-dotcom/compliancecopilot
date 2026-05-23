#!/usr/bin/env bash
set -euo pipefail

echo "ComplianceCopilot — dev setup"
echo "=============================="

# Check Docker
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker is not installed. Install Docker Desktop first."
  exit 1
fi

# Copy env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists — skipping"
fi

# Start services
echo ""
echo "Starting services with docker compose..."
docker compose up -d

echo ""
echo "Waiting for API to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost:8000/health &>/dev/null; then
    echo "API ready!"
    break
  fi
  sleep 2
done

echo ""
echo "ComplianceCopilot is running:"
echo "  Web:      http://localhost:3000"
echo "  API:      http://localhost:8000"
echo "  MinIO UI: http://localhost:9001"
echo ""
echo "1. Open http://localhost:3000"
echo "2. Register with a passkey"
echo "3. Add your LLM key in Settings"
echo "4. Submit a policy document"
