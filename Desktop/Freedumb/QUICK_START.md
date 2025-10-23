# 🚀 FREEDUMB Backend - Quick Start Guide

## Deploy in 3 Steps (15 minutes)

### Step 1: Push to GitHub (5 min)
```bash
./deploy-to-github.sh
```
Enter your GitHub repository URL when prompted.

### Step 2: Deploy to Railway (5 min)
1. Visit https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `freedumb-backend`
4. Add PostgreSQL + Redis services

### Step 3: Configure Environment (5 min)
In Railway, add these variables:

```env
NODE_ENV=production
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

**Done!** Your API will be live at: `https://your-app.up.railway.app`

---

## Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy and use in Railway

---

## Test Your Deployment
```bash
# Health check
curl https://your-app.up.railway.app/health

# API docs
open https://your-app.up.railway.app/api-docs
```

---

## Local Development
```bash
npm install
npm run dev
# Server runs at http://localhost:3000
```

---

## Need Help?
Read `DEPLOYMENT_COMPLETE.md` for detailed instructions.
