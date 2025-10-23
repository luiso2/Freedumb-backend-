#!/bin/bash

# FREEDUMB - GitHub Deployment Script
# This script prepares and pushes the backend to GitHub

set -e

echo "🚀 FREEDUMB Backend - GitHub Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Git repository not initialized. Initializing...${NC}"
    git init
    git branch -M master
fi

# Check if remote origin exists
if ! git remote | grep -q "origin"; then
    echo -e "${YELLOW}No remote 'origin' found.${NC}"
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/freedumb-backend.git): " REPO_URL
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ Remote origin added${NC}"
else
    echo -e "${GREEN}✓ Remote origin already configured${NC}"
fi

# Show current status
echo ""
echo -e "${BLUE}Current Git Status:${NC}"
git status --short

# Add all files
echo ""
echo -e "${BLUE}Adding files to git...${NC}"
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    # Prompt for commit message
    echo ""
    read -p "Enter commit message (or press Enter for default): " COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Update: FREEDUMB Backend with Railway deployment config"
    fi

    # Commit changes
    echo -e "${BLUE}Committing changes...${NC}"
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi

# Push to GitHub
echo ""
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -u origin master

echo ""
echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app and create a new project"
echo "2. Connect your GitHub repository"
echo "3. Add environment variables (see RAILWAY_DEPLOYMENT.md)"
echo "4. Deploy!"
echo ""
echo "Repository URL: $(git config --get remote.origin.url)"
echo ""
