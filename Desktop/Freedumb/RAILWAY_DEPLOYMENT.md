# FREEDUMB - Railway Deployment Guide 🚀

## Quick Deployment to Railway

### Prerequisites
- [Railway CLI](https://docs.railway.app/develop/cli) installed (optional)
- GitHub account
- Railway account (sign up at https://railway.app)

---

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: FREEDUMB Backend ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/freedumb-backend.git
git branch -M master
git push -u origin master
```

### Step 2: Deploy on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `freedumb-backend` repository
5. Railway will automatically detect the configuration

### Step 3: Add Environment Variables

In Railway Dashboard, go to your project → **Variables** tab and add:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-url.com

# PostgreSQL (Railway will auto-provide if you add PostgreSQL service)
DATABASE_URL=${DATABASE_URL}

# Or manually configure PostgreSQL
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=freedumb_db
DB_USER=freedumb_user
DB_PASSWORD=your-secure-password

# Redis (add Redis service in Railway)
REDIS_URL=${REDIS_URL}

# Or manually
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# MongoDB (add MongoDB service or use MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/freedumb_logs

# JWT Secrets (IMPORTANT: Use strong random strings)
JWT_SECRET=YOUR_256_BIT_SECRET_KEY_HERE
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_KEY_HERE
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# OpenAI API Key
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_KEY_HERE
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here-12345
ENCRYPTION_IV=16-char-iv-here
```

### Step 4: Add Database Services

1. In Railway, click **"New"** → **"Database"**
2. Add **PostgreSQL** (Railway provides this)
3. Add **Redis** (Railway provides this)
4. For MongoDB, either:
   - Add MongoDB service in Railway, OR
   - Use MongoDB Atlas (cloud) and set `MONGODB_URI`

Railway will automatically inject `DATABASE_URL` and `REDIS_URL` environment variables.

### Step 5: Deploy!

Railway will automatically deploy your app. Check the **Deployments** tab for progress.

Your API will be available at: `https://your-app.up.railway.app`

---

## Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to your Railway project
railway link

# Set environment variables from .env file
railway variables --set-from-file .env

# Deploy
railway up

# View logs
railway logs
```

---

## Database Setup

### PostgreSQL Schema Setup

After deployment, you need to create the database schema. You can:

**Option 1: Use Railway's PostgreSQL Query Tool**
1. Go to Railway Dashboard → PostgreSQL service
2. Click "Query" tab
3. Run the SQL schema from `ARCHITECTURE.md`

**Option 2: Use a Migration Script**
Create a file `setup-db.js` and run it once:

```javascript
// setup-db.js
require('dotenv').config();
const { Client } = require('pg');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Your SQL schema here
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Add more tables...
  `;

  await client.query(schema);
  await client.end();

  console.log('✅ Database setup complete!');
}

setupDatabase().catch(console.error);
```

Run locally or via Railway:
```bash
railway run node setup-db.js
```

---

## Monitoring & Logs

### View Logs
```bash
# Via CLI
railway logs

# Or in Railway Dashboard → Deployments → View Logs
```

### Health Check
Your app has a health endpoint at `/health`:

```bash
curl https://your-app.up.railway.app/health
```

### API Documentation
Access Swagger docs at:
```
https://your-app.up.railway.app/api-docs
```

---

## Custom Domain (Optional)

1. Go to Railway Dashboard → Your Service → Settings
2. Scroll to **Domains**
3. Click **"Generate Domain"** for Railway subdomain
4. Or click **"Custom Domain"** to add your own

---

## Scaling & Performance

### Vertical Scaling
Railway automatically scales based on your plan.

### Horizontal Scaling
For production, consider:
- Using Railway's **Pro Plan** for better resources
- Multiple instances with load balancing
- Separate Redis/PostgreSQL to dedicated services

### Optimization Tips
1. Enable connection pooling for PostgreSQL
2. Use Redis for caching
3. Enable compression in Express
4. Monitor memory usage
5. Set appropriate rate limits

---

## Environment Variables Reference

### Required Variables
- `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `JWT_REFRESH_SECRET` - Generate with same command

### Auto-Provided by Railway
- `DATABASE_URL` - When PostgreSQL service added
- `REDIS_URL` - When Redis service added
- `PORT` - Railway auto-assigns

### Optional Variables
- `NODE_ENV` - Set to `production`
- `LOG_LEVEL` - Default: `info`
- `RATE_LIMIT_MAX_REQUESTS` - Default: 100

---

## Troubleshooting

### Deployment Failed
- Check Railway logs: `railway logs`
- Verify all environment variables are set
- Check build logs for errors

### Database Connection Issues
- Ensure PostgreSQL service is running
- Verify `DATABASE_URL` is set correctly
- Check SSL settings if using external database

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is valid
- Check API usage limits
- Ensure billing is enabled on OpenAI account

### Port Issues
- Railway auto-assigns `PORT` variable
- Make sure your app uses `process.env.PORT`

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Strong JWT secrets set (32+ characters)
- [ ] Database schema created
- [ ] PostgreSQL, Redis, MongoDB services running
- [ ] Valid OpenAI API key with billing enabled
- [ ] Health check endpoint responding
- [ ] API documentation accessible
- [ ] Error monitoring configured (optional: Sentry)
- [ ] Rate limiting enabled
- [ ] CORS configured for production frontend
- [ ] SSL/TLS enabled (Railway auto-provides)
- [ ] Backup strategy for database
- [ ] Monitoring alerts configured

---

## Useful Commands

```bash
# View environment variables
railway variables

# Set a variable
railway variables set KEY=value

# Open dashboard
railway open

# View service logs
railway logs --service backend

# Run commands in Railway environment
railway run npm run migrate

# Restart service
railway restart

# View project info
railway status
```

---

## Cost Optimization

### Free Tier Limits
Railway offers $5 free credit per month:
- Keep costs low with:
  - Single instance
  - Shared PostgreSQL/Redis
  - Monitor usage

### Upgrade Considerations
- Pro plan: $20/month + usage
- Better for production
- More resources
- Better support

---

## Next Steps

1. **Frontend Deployment**: Deploy your frontend to Vercel/Netlify
2. **CI/CD**: Set up GitHub Actions for automated testing
3. **Monitoring**: Add Prometheus/Grafana or Railway metrics
4. **Backups**: Configure automated database backups
5. **Testing**: Run integration tests before each deployment

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **FREEDUMB Issues**: Create issue in GitHub repository

---

## Quick Links

- Railway Dashboard: https://railway.app/dashboard
- OpenAI API Keys: https://platform.openai.com/api-keys
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas

---

**Happy Deploying! 🚀**

**FREEDUMB Team**
