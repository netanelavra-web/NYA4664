# Deployment Guide for Whispr

## Prerequisites

- Firebase project created
- Vercel account (or alternative hosting)
- OpenAI API key
- Domain configured (optional)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Google Analytics (optional)

### 1.2 Enable Authentication

1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Enable Google OAuth
4. Add authorized domains

### 1.3 Create Firestore Database

1. Go to Firestore Database
2. Create database in production mode
3. Select region (closest to users)

### 1.4 Enable Storage

1. Go to Storage
2. Get started
3. Use production rules (we'll deploy custom rules)

### 1.5 Setup Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 1.6 Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 1.7 Create Composite Indexes

```bash
firebase deploy --only firestore:indexes
```

Or manually create in Firebase Console based on `firestore.indexes.json`

### 1.8 Setup Cloud Messaging

1. Go to Project Settings → Cloud Messaging
2. Generate Web Push certificates
3. Copy VAPID key to `.env.local`

## Step 2: Environment Variables

Create `.env.local` in project root:

```env
# Get from Firebase Project Settings
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (Service Account)
# Download JSON from Project Settings → Service Accounts
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VAPID_KEY=
```

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login

```bash
vercel login
```

### 3.3 Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

### 3.4 Add Environment Variables in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Redeploy

## Step 4: Configure Domain

### 4.1 Custom Domain (Vercel)

1. Vercel Dashboard → Domains
2. Add domain
3. Configure DNS records

### 4.2 Firebase Auth Domain

1. Firebase Console → Authentication → Settings
2. Add your custom domain to authorized domains

## Step 5: SSL & HTTPS

- Vercel handles SSL automatically
- Ensure all Firebase URLs use HTTPS

## Step 6: PWA Setup

### 6.1 Generate Icons

Use a tool like [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator):

1. Upload a 512x512 source image
2. Generate all icon sizes
3. Place in `/public/icons/`

### 6.2 Test PWA

1. Open in Chrome DevTools → Application
2. Check Manifest
3. Test Service Worker
4. Verify installability

## Step 7: Test Production

### Checklist

- [ ] User registration works
- [ ] Login with email/password works
- [ ] Login with Google works
- [ ] Message creation and encryption works
- [ ] Message opening works
- [ ] Event creation works
- [ ] Timeline loads correctly
- [ ] Push notifications work
- [ ] PWA install works
- [ ] Offline mode works
- [ ] RTL/LTR switching works
- [ ] All security rules enforced

## Step 8: Monitoring

### 8.1 Firebase Console

- Monitor Authentication usage
- Check Firestore reads/writes
- Review Cloud Functions logs
- Monitor Storage usage

### 8.2 Vercel Analytics

- Enable Vercel Analytics
- Monitor performance
- Check error logs

### 8.3 Error Tracking (Optional)

Consider adding Sentry:

```bash
npm install @sentry/nextjs
```

## Step 9: Scheduled Functions

Cloud Functions with scheduled triggers will run automatically. Verify in Firebase Console → Functions.

## Step 10: Backup Strategy

### Firestore Backup

Set up automated backups:

```bash
gcloud firestore export gs://your-bucket/backups
```

Or use Firebase Console → Firestore → Import/Export

## Rollback Plan

If deployment fails:

1. Vercel: Rollback to previous deployment in dashboard
2. Firebase Functions: Redeploy previous version
3. Firestore Rules: Revert via Firebase Console

## Performance Optimization

### 10.1 Next.js Optimization

- Enable Image Optimization
- Configure CDN caching
- Minimize bundle size

### 10.2 Firebase Optimization

- Use Firestore indexes
- Implement pagination
- Cache frequently accessed data

## Security Checklist

- [ ] All API keys in environment variables
- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed and tested
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] CORS configured correctly
- [ ] Rate limiting on Cloud Functions

## Cost Monitoring

### Firebase

- Free tier: 50k reads/day, 20k writes/day
- Monitor usage in Firebase Console

### Vercel

- Free tier: 100GB bandwidth
- Monitor in Vercel Dashboard

### OpenAI

- Set usage limits in OpenAI Dashboard
- Monitor costs regularly

## Support & Maintenance

- Set up error alerting
- Schedule regular security audits
- Keep dependencies updated
- Monitor user feedback

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________
