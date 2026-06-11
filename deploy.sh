#!/bin/bash

# Frontend Deployment Script for MeLT
# Frontend URL: https://www.msomilegaltech.com
# Port: 3003

set -e  # Exit on error

echo "🚀 Starting Frontend Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set environment variables
export PORT=3003
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://www.api.msomilegaltech.com

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 Building production application...${NC}"
npm run build

echo -e "${YELLOW}🛑 Stopping existing PM2 process (if running)...${NC}"
pm2 stop lega-frontend || true
pm2 delete lega-frontend || true

echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start npm --name "lega-frontend" \
    --update-env \
    -- \
    start \
    -- -p 3003

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (optional - uncomment if needed)
# pm2 startup

echo -e "${GREEN}✅ Frontend deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application running on: https://www.msomilegaltech.com${NC}"
echo -e "${GREEN}📊 Check status with: pm2 status lega-frontend${NC}"
echo -e "${GREEN}📋 View logs with: pm2 logs lega-frontend${NC}"
echo -e "${GREEN}🔄 Restart with: pm2 restart lega-frontend${NC}"

# Show PM2 status
pm2 status lega-frontend

