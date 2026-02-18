# Environment Variables — Eureka-Lab Platform

> All environment variables documented here.
> Maintained by ARCH + DEVOPS agents.
> **Never commit real values to git. This file contains placeholders only.**

---

## Frontend (apps/web/.env.local)

```bash
# ── API ─────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# ── Firebase (client-side — safe to expose) ─────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ── Stripe (publishable key — safe to expose) ───────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── Monitoring ───────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# ── Feature flags ────────────────────────────────────────────────
NEXT_PUBLIC_FEATURE_LEVEL2_ENABLED=false
NEXT_PUBLIC_FEATURE_LEVEL3_ENABLED=false
NEXT_PUBLIC_FEATURE_LEVEL4_ENABLED=false
```

---

## Backend (apps/api — Railway environment variables)

```bash
# ── Runtime ──────────────────────────────────────────────────────
NODE_ENV=development
PORT=3001

# ── Anthropic AI ────────────────────────────────────────────────
# ⚠️  NEVER expose this to frontend under any circumstances
ANTHROPIC_API_KEY=sk-ant-...

# ── Firebase Admin SDK ───────────────────────────────────────────
# Download service account JSON from Firebase Console → Project Settings → Service Accounts
# Then extract fields:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
# For Railway: encode private key as base64 to avoid newline issues
# Command: cat serviceAccount.json | python3 -c "import sys,base64,json; d=json.load(sys.stdin); print(d['private_key'])" | base64
FIREBASE_PRIVATE_KEY_BASE64=LS0tLS1CRUdJTi...

# ── Redis (Upstash) ──────────────────────────────────────────────
REDIS_URL=redis://default:password@us1-xxx.upstash.io:32654
REDIS_TOKEN=your-upstash-rest-token

# ── Stripe ───────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Product price IDs (from Stripe dashboard)
STRIPE_PRICE_EXPLORER_MONTHLY=price_xxx
STRIPE_PRICE_EXPLORER_ANNUAL=price_xxx
STRIPE_PRICE_CREATOR_MONTHLY=price_xxx
STRIPE_PRICE_CREATOR_ANNUAL=price_xxx

# ── AWS (for content moderation) ─────────────────────────────────
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# ── Email (Resend) ────────────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# ── Monitoring ───────────────────────────────────────────────────
SENTRY_DSN=https://xxx@sentry.io/xxx

# ── CORS ─────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## CI/CD (GitHub Actions Secrets)

Set these in GitHub → Settings → Secrets and variables → Actions:

```
# Firebase test project (separate from production)
FIREBASE_PROJECT_ID_TEST
FIREBASE_CLIENT_EMAIL_TEST
FIREBASE_PRIVATE_KEY_BASE64_TEST

# Anthropic (test budget — set a low limit on this key)
ANTHROPIC_API_KEY_TEST

# Vercel (for preview deployments)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Railway (for staging deployment)
RAILWAY_TOKEN

# Codecov (coverage reporting)
CODECOV_TOKEN
```

---

## Environment Tiers

| Variable | Local Dev | Staging | Production |
|----------|-----------|---------|------------|
| Firebase project | dev project | staging project | prod project |
| Anthropic key | test key (low limit) | test key | production key |
| Stripe | test mode keys | test mode keys | live mode keys |
| Redis | local Docker OR Upstash free | Upstash paid | Upstash paid |

---

## Setup Commands for New Developer

```bash
# 1. Copy frontend env template
cp apps/web/.env.example apps/web/.env.local

# 2. Copy backend env template
cp apps/api/.env.example apps/api/.env

# 3. Fill in values from team password manager (1Password / Bitwarden)

# 4. Verify backend env validation passes
cd apps/api && pnpm start:dev
# If env vars are wrong, Joi will throw at startup with specific error

# 5. Verify Firebase connection
cd apps/api && pnpm run firebase:test
```

---

## Key Rotation Schedule

| Secret | Rotation Frequency | Responsibility |
|--------|-------------------|----------------|
| ANTHROPIC_API_KEY | Every 90 days | DEVOPS |
| STRIPE_SECRET_KEY | Every 180 days | DEVOPS |
| Firebase service account | Every 12 months | DEVOPS |
| AWS credentials | Every 90 days | DEVOPS |
| STRIPE_WEBHOOK_SECRET | On endpoint change | BE + DEVOPS |

---

*Version: 1.0 | Maintained by: ARCH + DEVOPS | Last updated: Sprint 1*
