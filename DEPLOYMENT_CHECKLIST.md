# 🚀 Deployment Checklist - App Conecta Saúde

## 1. Backend Setup ✅

- [x] Node.js + Express configured
- [x] MongoDB connection string set via `MONGO_URI` env var
- [x] JWT authentication with `JWT_SECRET` env var
- [x] Helmet security headers enabled
- [x] Rate limiting implemented
- [x] Health check endpoint: `GET /api/health` + `GET /health`
- [x] Socket.IO configured for real-time chat
- [x] All routes registered:
  - `/api/auth` - User authentication
  - `/api/professionals` - Professional profiles
  - `/api/users` - User management
  - `/api/subscriptions` - Subscription plans
  - `/api/appointments` - Video consultation booking
  - `/api/payments` - Payment processing (Mercado Pago)
  - `/api/repassess` - Professional earnings
  - `/api/audit` - Audit logs
  - `/api/connections` - Patient-professional relationships
  - `/api/messages` - Chat messaging

## 2. Frontend Setup ✅

- [x] Expo React Native configured
- [x] Axios API client with JWT interceptor
- [x] AsyncStorage for token persistence
- [x] React Navigation multi-screen architecture
- [x] Socket.IO client for real-time chat
- [x] Payment flow with status polling
- [x] Plan selection and QR code display
- [x] User authentication and profile sync

## 3. Database Configuration ✅

- [x] MongoDB Atlas connection active
- [x] Collections created:
  - `users` - Patient and professional accounts
  - `professionals` - Professional profiles
  - `subscriptions` - Subscription records
  - `payments` - Payment transactions (Mercado Pago)
  - `connections` - Patient-professional links
  - `messages` - Chat messages
  - `appointments` - Video consultation bookings
  - `repassess` - Professional earnings
  - `auditlogs` - System audit trail

## 4. Environment Variables Required

### Backend `.env` file:
```
MONGO_URI=mongodb+srv://[user]:[password]@[cluster]/[database]
JWT_SECRET=[generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
ENCRYPTION_KEY=[generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
INTERNAL_API_KEY=[generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
MP_ACCESS_TOKEN=[Mercado Pago access token from dashboard]
GOOGLE_CLIENT_ID=[from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[from Google Cloud Console]
BACKEND_BASE_URL=http://localhost:3000 (local) or https://[railway-domain] (production)
NODE_ENV=production (on Railway)
PORT=3000 (or Railway's assigned port)
```

### Frontend `api.js` (or .env):
```
API_BASE_URL=http://10.0.0.172:3000 (local) or https://[railway-domain] (production)
```

## 5. Payment Integration ✅

- [x] Mercado Pago SDK installed and configured
- [x] PIX payment method implemented
- [x] Payment webhook endpoint ready: `POST /api/payments/webhook`
- [x] Subscription auto-activation on payment approval
- [x] Payment status polling from frontend
- [x] User profile sync after payment: `GET /api/auth/me`

## 6. Security Measures ✅

- [x] Helmet.js security headers
- [x] CORS configured for frontend origins
- [x] Rate limiting on auth endpoints
- [x] Input sanitization
- [x] JWT token verification on protected routes
- [x] Password hashing with bcryptjs
- [x] Socket.IO authentication

## 7. Testing Checklist

### Local Testing:
- [ ] Backend starts: `node index.js` or `npm start`
- [ ] Health check responds: `curl http://localhost:3000/api/health`
- [ ] MongoDB connects successfully
- [ ] Frontend connects to backend API
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Payment flow completes: plan selection → PIX display → status polling
- [ ] Subscription activation verified
- [ ] Chat messaging works with plan validation
- [ ] Appointment creation enforces active plan

### Production Testing (Railway):
- [ ] Backend deploys without errors
- [ ] Health check responds: `curl https://[railway-domain]/api/health`
- [ ] MongoDB Atlas connection works
- [ ] Payment webhooks received from Mercado Pago
- [ ] Frontend can reach backend API
- [ ] End-to-end payment flow works with live PIX
- [ ] User profile updates after payment

## 8. Deployment Steps

### To Railway:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Set environment variables in Railway Settings:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `MP_ACCESS_TOKEN`
   - `NODE_ENV=production`
5. Deploy: `railway up` or push to Git for auto-deploy
6. Test: `curl https://[railway-domain]/api/health`

### To Frontend:
1. Update `API_BASE_URL` in `HealthcareApp/api.js`
2. Build: `expo build:android` or `expo build:ios`
3. Test via Expo Go: `expo start`

## 9. Monitoring

- [ ] Health check endpoint monitored
- [ ] MongoDB connection status checked
- [ ] Error logs reviewed daily
- [ ] Payment webhook delivery verified
- [ ] User authentication logs audited

## 10. Post-Deployment

- [ ] Mercado Pago webhook configured: `https://[railway-domain]/api/payments/webhook`
- [ ] Google OAuth redirect URIs updated in Google Cloud Console
- [ ] BACKEND_BASE_URL env var set to production domain
- [ ] Frontend API_BASE_URL updated to production domain
- [ ] SSL certificate verified (Railway provides auto-HTTPS)
- [ ] Rate limiting adjusted if needed
- [ ] Database backups configured

---

**Status**: ✅ All core features implemented, ready for deployment
**Next Steps**: 1) Test locally, 2) Deploy to Railway, 3) Verify production setup
