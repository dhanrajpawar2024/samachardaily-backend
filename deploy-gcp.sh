#!/bin/bash
# ============================================================
#  SamacharDaily — GCP VM Setup & Deploy Script
#  Run this ONCE on a fresh GCP Ubuntu 22.04 VM
#  Usage: bash deploy-gcp.sh
# ============================================================

set -e

echo "==> Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin

echo "==> Configuring system for Elasticsearch..."
# Elasticsearch requires this kernel setting
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

echo "==> Checking .env file..."
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Copy .env.gcp.example to .env and fill in your values first:"
  echo "  cp .env.gcp.example .env && nano .env"
  exit 1
fi

# Validate required vars are set
required_vars=("GCP_EXTERNAL_IP" "POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=.\+" .env; then
    echo "ERROR: $var is not set in .env"
    exit 1
  fi
done

echo "==> Building and starting all services..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.gcp.yml \
  up -d --build

echo ""
echo "==> Waiting for services to be healthy..."
sleep 30

echo ""
echo "==> Container status:"
docker compose ps

EXTERNAL_IP=$(grep "^GCP_EXTERNAL_IP=" .env | cut -d= -f2)
echo ""
echo "=============================================="
echo "  Deployment complete!"
echo "  Web App:        http://${EXTERNAL_IP}:4000"
echo "  Admin Dashboard: http://${EXTERNAL_IP}:5000"
echo "  API Gateway:     http://${EXTERNAL_IP}:3000"
echo "=============================================="
