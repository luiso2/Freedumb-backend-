# 🔐 Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for your Finance Agent backend.

---

## 📋 Prerequisites

- Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)
- Backend server running (locally or on Railway)

---

## 🚀 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `Freedumb Finance Agent`
5. Click "Create"

### 2. Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on "Google+ API"
4. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "**Create Credentials**" → "**OAuth client ID**"
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (for testing) or Internal (for organization only)
   - **App name**: `Freedumb Finance Agent`
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - Click "Save and Continue"
   - **Scopes**: Add `email` and `profile` (optional step)
   - Click "Save and Continue"
   - **Test users** (if External): Add your test email addresses
   - Click "Save and Continue"

4. Now create the OAuth client ID:
   - **Application type**: Web application
   - **Name**: `Freedumb Finance Backend`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-app.railway.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     https://your-app.railway.app/api/auth/google/callback
     ```
   - Click "Create"

5. **Copy your credentials**:
   - Copy the **Client ID** (looks like: `xxx.apps.googleusercontent.com`)
   - Copy the **Client Secret**

### 4. Update .env File

Open your `.env` file and update the Google OAuth variables:

```env
# ===== Google OAuth Configuration =====
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

**For Production (Railway):**

In Railway dashboard, add these environment variables:
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback
FRONTEND_URL=https://your-frontend.com
```

### 5. Restart Your Server

```bash
# Stop any running servers
pkill -9 node

# Start the server
npm start
```

---

## 🧪 Testing Google OAuth

### Test Locally

1. Open your browser and go to:
   ```
   http://localhost:3000/api/auth/google
   ```

2. You should be redirected to Google's OAuth consent screen

3. Select your Google account

4. Approve the requested permissions

5. You'll be redirected back to your callback URL with JWT tokens

### Expected Response Flow

**Option 1: JSON Response** (uncomment in routes/auth.js)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Option 2: Frontend Redirect** (default)
```
http://localhost:3001/auth/callback?accessToken=xxx&refreshToken=yyy
```

---

## 📊 Database Impact

When a user signs in with Google for the first time, a new User document is created:

```javascript
{
  "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
  "name": "John Doe",
  "email": "user@gmail.com",
  "username": "user_abc123",
  "password": "google_oauth_randomhash",
  "googleId": "1234567890",
  "authProvider": "google",
  "role": "user",
  "isActive": true,
  "lastLogin": "2025-10-25T19:30:00.000Z",
  "metadata": {
    "lastLoginIP": "192.168.1.1",
    "loginCount": 1
  }
}
```

**Sessions Collection:**
```javascript
{
  "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "isActive": true,
  "expiresAt": "2025-10-25T20:30:00.000Z"
}
```

**AuthLogs Collection:**
```javascript
{
  "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
  "action": "login",
  "success": true,
  "timestamp": "2025-10-25T19:30:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 🔄 OAuth Flow Diagram

```
User clicks "Login with Google"
         ↓
GET /api/auth/google
         ↓
Redirect to Google OAuth Consent Screen
         ↓
User approves access
         ↓
Google redirects to /api/auth/google/callback
         ↓
Backend exchanges code for access token
         ↓
Backend retrieves user profile from Google
         ↓
Backend checks if user exists in database
         ↓
If yes: Update lastLogin
If no: Create new user
         ↓
Generate JWT tokens
         ↓
Save session to database
         ↓
Log authentication event
         ↓
Redirect to frontend with tokens
```

---

## 🛠 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The callback URL doesn't match what's registered in Google Cloud Console.

**Solution**:
- Make sure the callback URL in `.env` exactly matches one of the **Authorized redirect URIs** in Google Cloud Console
- Check for trailing slashes (should NOT have one)
- Make sure protocol matches (http vs https)

### Error: "invalid_client"

**Problem**: Client ID or Client Secret is incorrect.

**Solution**:
- Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces or quotes
- Regenerate credentials in Google Cloud Console if needed

### Error: "access_denied"

**Problem**: User didn't approve the OAuth consent screen.

**Solution**:
- Try the flow again
- Make sure the user clicks "Allow" on the consent screen

### Users can't login

**Problem**: OAuth consent screen is not published.

**Solution**:
1. Go to **APIs & Services** → **OAuth consent screen**
2. If status is "Testing", add your email to "Test users"
3. Or publish the app (requires verification for production)

---

## 🔒 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Rotate secrets** regularly in production
3. **Use HTTPS** in production (set `secure: true` in session config)
4. **Limit scopes** to only what you need (`profile` and `email`)
5. **Validate tokens** on every authenticated request
6. **Set short expiration** for access tokens (1 hour)
7. **Use refresh tokens** for long-lived sessions

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [passport-google-oauth20 npm package](https://www.npmjs.com/package/passport-google-oauth20)

---

## ✅ Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 credentials
- [ ] Configured OAuth consent screen
- [ ] Added authorized redirect URIs
- [ ] Copied Client ID and Client Secret
- [ ] Updated `.env` file with credentials
- [ ] Restarted server
- [ ] Tested OAuth flow
- [ ] Verified user creation in database
- [ ] Configured production environment variables (Railway)

---

**Need help?** Check the logs for detailed error messages:
```bash
# View server logs
npm start

# View Railway logs
railway logs --tail
```
