#!/bin/bash

# FREEDUMB Backend - Setup Verification Script
# This script verifies that the backend is properly configured

set -e

echo "🔍 FREEDUMB Backend - Setup Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track errors
ERRORS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        if [ ! -z "$2" ]; then
            VERSION=$($1 $2 2>&1)
            echo -e "  ${BLUE}→${NC} Version: $VERSION"
        fi
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 is MISSING"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/ exists"
    else
        echo -e "${RED}✗${NC} $1/ is MISSING"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Checking Prerequisites..."
echo "----------------------------"
check_command "node" "--version"
check_command "npm" "--version"
check_command "git" "--version"
echo ""

echo "📁 Checking Project Structure..."
echo "---------------------------------"
check_file "package.json"
check_file "package-lock.json"
check_file ".env.example"
check_file "README.md"
check_file "Dockerfile"
check_file "railway.json"
check_file "Procfile"
check_dir "src"
check_dir "node_modules"
echo ""

echo "🔧 Checking Source Files..."
echo "---------------------------"
check_file "src/server.js"
check_dir "src/routes"
check_dir "src/controllers"
check_dir "src/services"
check_dir "src/middleware"
check_dir "src/database"
check_file "src/services/openai.service.js"
echo ""

echo "🔐 Checking Environment Configuration..."
echo "-----------------------------------------"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"

    # Check for critical variables
    if grep -q "OPENAI_API_KEY=" .env; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY is set"
    else
        echo -e "${YELLOW}⚠${NC} OPENAI_API_KEY is not set"
    fi

    if grep -q "JWT_SECRET=" .env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "${YELLOW}⚠${NC} JWT_SECRET is not set"
    fi

    if grep -q "DB_HOST=" .env; then
        echo -e "${GREEN}✓${NC} Database config is set"
    else
        echo -e "${YELLOW}⚠${NC} Database config may be incomplete"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (using .env.example as template)"
fi
echo ""

echo "📦 Checking Dependencies..."
echo "---------------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"

    # Check critical packages
    CRITICAL_PACKAGES=("express" "openai" "sequelize" "redis" "mongoose")
    for pkg in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            echo -e "${GREEN}✓${NC} $pkg installed"
        else
            echo -e "${RED}✗${NC} $pkg NOT installed"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} node_modules not found. Run 'npm install'"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "🌐 Checking Git Configuration..."
echo "--------------------------------"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"

    if git remote | grep -q "origin"; then
        REMOTE_URL=$(git config --get remote.origin.url)
        echo -e "${GREEN}✓${NC} Remote origin configured"
        echo -e "  ${BLUE}→${NC} URL: $REMOTE_URL"
    else
        echo -e "${YELLOW}⚠${NC} No remote origin configured"
    fi
else
    echo -e "${YELLOW}⚠${NC} Git repository not initialized"
fi
echo ""

echo "📊 Summary"
echo "=========="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your FREEDUMB backend is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Review and update .env file with your API keys"
    echo "2. Run './deploy-to-github.sh' to push to GitHub"
    echo "3. Deploy to Railway (see RAILWAY_DEPLOYMENT.md)"
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi
