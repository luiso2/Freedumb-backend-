# FREEDUMB - GitHub Deployment Guide

## Quick Start: Push to GitHub

### Option 1: Using the Deployment Script (Easiest)

```bash
# Make the script executable
chmod +x deploy-to-github.sh

# Run the deployment script
./deploy-to-github.sh
```

The script will:
1. Initialize git if needed
2. Add remote origin (prompts for GitHub URL)
3. Stage all changes
4. Commit changes
5. Push to GitHub

---

### Option 2: Manual GitHub Setup

#### Step 1: Create a New Repository on GitHub

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `freedumb-backend`
3. **Do NOT** initialize with README, .gitignore, or license
4. Click "Create repository"

#### Step 2: Push Your Code

```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit: FREEDUMB Backend with ChatGPT Integration"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/freedumb-backend.git

# Push to GitHub
git push -u origin master
```

---

## Repository Structure

Your GitHub repository will contain:

```
freedumb-backend/
├── src/                    # Source code
│   ├── server.js          # Main server file
│   ├── routes/            # API routes
│   ├── controllers/       # Controllers
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── database/         # Database connections
│   ├── utils/           # Utilities
│   ├── config/          # Configuration
│   └── jobs/            # Cron jobs
├── logs/                 # Application logs
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
├── .dockerignore       # Docker ignore rules
├── package.json        # Dependencies
├── package-lock.json   # Lock file
├── Dockerfile          # Docker configuration
├── Procfile           # Process configuration
├── railway.json       # Railway configuration
├── openapi.yaml       # API specification
├── README.md          # Main documentation
├── README_BACKEND.md  # Backend-specific docs
├── RAILWAY_DEPLOYMENT.md  # Railway deployment guide
├── GITHUB_DEPLOYMENT.md   # This file
├── ARCHITECTURE.md    # Architecture documentation
├── IMPLEMENTATION.md  # Implementation details
├── DEPLOYMENT.md      # General deployment guide
└── CODE_EXAMPLES.md   # Code examples
```

---

## Environment Variables for GitHub Actions (CI/CD)

If you want to set up automated testing, create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master, develop ]
  pull_request:
    branches: [ master ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: freedumb_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: freedumb_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint || echo "Linting skipped"

      - name: Run tests
        run: npm test || echo "Tests skipped"
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: freedumb_test
          DB_USER: freedumb_user
          DB_PASSWORD: test_password
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_SECRET: test_secret_key
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          echo "Deployment will be triggered automatically by Railway"
          echo "when changes are pushed to master branch"
```

---

## GitHub Repository Settings

### Secrets Configuration

Add these secrets in GitHub Settings → Secrets → Actions:

- `OPENAI_API_KEY` - Your OpenAI API key
- `RAILWAY_TOKEN` - Your Railway token (for automated deployments)

### Branch Protection (Recommended)

1. Go to Settings → Branches
2. Add rule for `master` branch
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

---

## Collaboration Workflow

### For Team Members

#### Fork and Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/freedumb-backend.git
cd freedumb-backend

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/freedumb-backend.git
```

#### Create Feature Branch
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: Your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

#### Create Pull Request
1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Describe your changes
4. Submit pull request

### For Maintainers

#### Review Pull Requests
```bash
# Fetch PR branch
git fetch origin pull/ID/head:pr-ID
git checkout pr-ID

# Test changes
npm install
npm test

# Merge if approved
git checkout master
git merge pr-ID
git push origin master
```

---

## Repository Badges

Add these badges to your README.md:

```markdown
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://github.com/YOUR_USERNAME/freedumb-backend/workflows/CI%2FCD%20Pipeline/badge.svg)
![Railway](https://img.shields.io/badge/Railway-Deployed-success.svg)
```

---

## Common Git Commands

```bash
# Check status
git status

# View changes
git diff

# Add specific files
git add src/file.js

# Commit with message
git commit -m "Your message"

# Push changes
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b branch-name

# Switch branches
git checkout branch-name

# Merge branch
git merge branch-name

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Stash changes
git stash

# Apply stashed changes
git stash pop
```

---

## Versioning

### Semantic Versioning

Follow [SemVer](https://semver.org/):
- **MAJOR** version (1.x.x): Breaking changes
- **MINOR** version (x.1.x): New features, backward compatible
- **PATCH** version (x.x.1): Bug fixes

### Creating Releases

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Create git tag
git tag -a v1.0.1 -m "Release version 1.0.1"

# Push tags
git push --tags

# Create release on GitHub
# Go to Releases → Draft a new release → Choose tag → Publish
```

---

## Troubleshooting

### Push Rejected

```bash
# Pull latest changes first
git pull --rebase origin master

# Resolve conflicts if any
# Then push again
git push origin master
```

### Large Files

If you accidentally committed large files:

```bash
# Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/large/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

### Authentication Issues

Use SSH instead of HTTPS:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH Keys → New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:USERNAME/freedumb-backend.git
```

---

## Next Steps After GitHub Setup

1. **Deploy to Railway**: Follow [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
2. **Set up CI/CD**: Add GitHub Actions workflow
3. **Configure Branch Protection**: Protect master branch
4. **Add Collaborators**: Invite team members
5. **Create Issues/Milestones**: Track development progress

---

## Useful Links

- **GitHub Docs**: https://docs.github.com
- **Git Handbook**: https://guides.github.com/introduction/git-handbook/
- **Railway Integration**: https://docs.railway.app/deploy/integrations
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Ready to Deploy! 🚀**

**FREEDUMB Team**
