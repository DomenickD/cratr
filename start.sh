#!/bin/bash

# Cratr Enterprise Start Script
# Usage: chmod +x start.sh && ./start.sh

echo "🚀 Starting Cratr Enterprise Solution..."

# 1) Cleanup existing environment
echo "🧹 Cleaning up old containers and volumes..."
docker compose down -v --remove-orphans || true

# 2) Build and launch services
echo "🏗️  Building and launching containers..."
docker compose up --build -d

# 3) Wait for Postgres to be ready
echo "⏳ Waiting for Postgres to be ready..."
until docker exec cratr_db pg_isready -U postgres >/dev/null 2>&1; do
  printf "."
  sleep 1
done
echo "✅ Postgres is ready."

# 4) Run Initial Migrations & Seed
echo "📦 Initializing Database..."
# Ensure versions directory exists
docker exec cratr_backend mkdir -p /app/migrations/versions

# We generate a fresh migration if none exists
docker exec cratr_backend alembic revision --autogenerate -m "auto_init" || echo "Revision already exists or failed."
docker exec cratr_backend alembic upgrade head
docker exec cratr_backend python seed.py

echo "✨ Cratr is now running!"
echo "Frontend: http://localhost:8080"
echo "Backend API: http://localhost:8081"
echo "Backend Docs: http://localhost:8081/docs"
echo ""
echo "Seeded Users (Password: password):"
echo " - admin (JICSOC)"
echo " - requestor (JICSOC)"
echo " - seed_admin (Seed)"
echo ""
echo "Thank you for using Cratr! - Dobby"
