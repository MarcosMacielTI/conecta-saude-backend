# 🚀 Deployment Guide - App Conecta Saúde

## Overview
App Conecta Saúde is a **React Native + Node.js healthcare platform** connecting patients with professionals through a subscription-based model with integrated payment processing (Mercado Pago), real-time chat, and video consultations.

---

## ✅ System Status

- **Backend**: Node.js + Express + MongoDB ✅
- **Frontend**: Expo React Native ✅
- **Database**: MongoDB Atlas ✅
- **Payments**: Mercado Pago integrated ✅
- **Real-time**: Socket.IO for chat ✅
- **Authentication**: JWT + Google OAuth ✅
- **Security**: Helmet + Rate limiting ✅

---

## 🔧 Local Development

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (cloud) or local MongoDB
- Mercado Pago developer account (for payment sandbox)
- Google Cloud Console OAuth credentials

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with required variables
# (See .env.example or section below)

# Start development server
npm start
# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
cd HealthcareApp

# Install dependencies
npm install

# Start Expo development server
npm start

# Choose:
# a - Android emulator
# i - iOS simulator
# w - Web browser
# j - Debug in browser
```

### Testing Locally

1. **Health Check**:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "mongodb": "connected",
     "uptime": 123.456
   }
   ```

2. **User Registration**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "João Silva",
       "email": "joao@example.com",
       "cpf": "123.456.789-00",
       "password": "secure123",
       "role": "patient"
     }'
   ```

3. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "joao@example.com",
       "password": "secure123"
     }'
   ```

4. **Get Profile**:
   ```bash
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## 🌐 Production Deployment (Railway)

### Step 1: Prepare Backend

```bash
# Ensure package-lock.json is committed
git add backend/package-lock.json
git commit -m "Add package-lock.json"

# Verify all files are pushed
git push origin main
```

### Step 2: Create Railway App

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project (create new or link existing)
railway link

# Or via Railway Dashboard:
# 1. Go to railway.app
# 2. Create new project → GitHub
# 3. Select this repository
# 4. Select Node.js starter template
```

### Step 3: Configure Environment Variables

In **Railway Settings** → Environment Variables, add:

```
MONGO_URI=mongodb+srv://[user]:[password]@[cluster]/[database]
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ENCRYPTION_KEY=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
INTERNAL_API_KEY=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
MERCADO_PAGO_ACCESS_TOKEN=<from MP dashboard>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NODE_ENV=production
PORT=3000
BACKEND_BASE_URL=https://[YOUR-RAILWAY-DOMAIN]
```

### Step 4: Generate Secure Keys

```bash
# In your terminal (or use Node.js):
node -e "const crypto = require('crypto'); console.log('JWT_SECRET:', crypto.randomBytes(32).toString('hex')); console.log('ENCRYPTION_KEY:', crypto.randomBytes(32).toString('hex')); console.log('INTERNAL_API_KEY:', crypto.randomBytes(32).toString('hex'));"
```

### Step 5: Configure Mercado Pago Webhooks

1. Go to **Mercado Pago Dashboard** → Settings → Webhooks
2. Add webhook URL:
   ```
   https://[YOUR-RAILWAY-DOMAIN]/api/payments/webhook
   ```
3. Select events:
   - payment.created
   - payment.updated

### Step 6: Update Google OAuth Redirect URIs

1. Go to **Google Cloud Console** → APIs & Services → OAuth 2.0 Client IDs
2. Add authorized redirect URIs:
   ```
   https://[YOUR-RAILWAY-DOMAIN]/auth/callback
   https://auth.expo.io/@[YOUR-EXPO-USERNAME]/[YOUR-APP-NAME]
   ```

### Step 7: Deploy

```bash
# Option A: Push to GitHub (auto-deploy)
git push origin main
# Railway auto-deploys on every push

# Option B: Deploy manually via CLI
railway up
```

### Step 8: Verify Deployment

```bash
# Check health endpoint
curl https://[YOUR-RAILWAY-DOMAIN]/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "mongodb": "connected",
#   "uptime": 123.456
# }

# Check logs
railway logs
```

---

## 📱 Frontend Deployment

### Update API Base URL

Edit `HealthcareApp/api.js`:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://[YOUR-RAILWAY-DOMAIN]'
  : 'http://localhost:3000';
```

### Build Android APK

```bash
cd HealthcareApp

# Build with Expo
eas build --platform android

# Or use Railway-connected Expo:
expo build:android
```

### Build iOS App

```bash
eas build --platform ios
```

### Deploy to App Stores

- **Google Play**: Upload APK/AAB via Google Play Console
- **Apple App Store**: Upload via Xcode/App Store Connect

---

## 🔒 Security Checklist

- [x] HTTPS enforced via Helmet
- [x] CORS properly configured
- [x] Rate limiting on auth endpoints
- [x] JWT tokens verified on protected routes
- [x] Passwords hashed with bcryptjs
- [x] Input sanitization enabled
- [x] Environment variables not committed
- [ ] CSRF protection (if form-based)
- [ ] SQL injection prevention (MongoDB is schema-less, so safe)
- [ ] XSS protection (React escapes by default)
- [ ] Regular security audits scheduled

---

## 📊 Monitoring

### Health Check Endpoint

```bash
# Set up a cron job or monitoring service to periodically check:
curl https://[YOUR-RAILWAY-DOMAIN]/api/health
```

### Error Logging

View Railway logs:
```bash
railway logs
# or via Dashboard: Railway.app → Project → Logs
```

### Database Monitoring

Monitor MongoDB Atlas:
- Go to MongoDB Atlas Dashboard
- Check connection statistics
- Review slow queries
- Monitor storage usage

### Payment Processing

Monitor Mercado Pago:
- Dashboard: Check payment statuses
- Webhooks: Verify webhook delivery
- Transactions: Track all payments

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check .env file exists and has all required variables
cat backend/.env

# Check MongoDB connection
# Use MongoDB Atlas: verify IP whitelist includes your IP

# Check port 3000 is available
# Or set PORT environment variable to different port
```

### Frontend can't reach backend
```bash
# Update API_BASE_URL in HealthcareApp/api.js
# Make sure backend is running and accessible
# Check CORS configuration

# Test connectivity:
curl https://[YOUR-RAILWAY-DOMAIN]/api/health
```

### Payments not working
```bash
# Verify Mercado Pago token is set
# Check webhook URL is correct and accessible
# Verify webhook event types are correct

# Test payment creation:
curl -X POST https://[YOUR-RAILWAY-DOMAIN]/api/payments/create-pix \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"planId": "basico"}'
```

### Chat not working
```bash
# Verify Socket.IO connection is established
# Check user has active subscription
# Verify JWT token is valid

# Check Socket.IO logs in backend
```

---

## 📋 Post-Deployment Checklist

- [ ] Backend health check returns 200
- [ ] MongoDB connection verified
- [ ] Frontend connects to backend successfully
- [ ] User registration works
- [ ] Payment flow completes (PIX QR code displays)
- [ ] Subscription activation works
- [ ] Chat messaging works with plan validation
- [ ] Mercado Pago webhooks being received
- [ ] Error logs are being captured
- [ ] SSL certificate is valid (HTTPS)
- [ ] Rate limiting is working
- [ ] Security headers are set
- [ ] Database backups are configured
- [ ] Monitoring alerts are set up

---

## 🔄 Continuous Integration / Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: railway/cli/action@v1
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      - run: railway up
```

### Railway Automatic Deploys

Railway automatically deploys when you push to GitHub:
1. Link Railway project to GitHub repo
2. Push code to main branch
3. Railway automatically builds and deploys

---

## 📞 Support

For issues or questions:
1. Check logs: `railway logs` or Railway Dashboard
2. Review error messages in browser console
3. Check MongoDB Atlas activity
4. Verify Mercado Pago webhook delivery
5. Test health endpoint: `/api/health`

---

## 🎯 Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Configure environment variables
3. ✅ Test health check endpoint
4. ✅ Deploy frontend to App Stores
5. ✅ Monitor production logs
6. ✅ Set up alerting for errors
7. ✅ Configure automated backups
8. ✅ Plan regular security audits

---

**Last Updated**: 2024
**Status**: Production Ready ✅
