#!/bin/bash
# MeLT Frontend – standalone start script
# Run from repo root or from lega-frontend/

set -e
cd "$(dirname "$0")"

echo "🖥️  MeLT Frontend"
echo "=================="

# Dependencies
if [ "${FORCE_INSTALL}" = "1" ]; then
    echo "📦 Installing dependencies (FORCE_INSTALL=1)..."
    npm ci || npm install
else
    if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
        echo "✅ Dependencies OK"
    else
        echo "📦 Installing dependencies..."
        npm ci || npm install
    fi
fi

echo "🚀 Starting Next.js dev server..."
exec npm run dev
