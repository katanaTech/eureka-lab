# Environment Variables — Eureka-Lab Platform

> All environment variables used across apps. Never commit `.env` files to git.

---

## Frontend (`apps/web`)

All frontend vars must be prefixed with `NEXT_PUBLIC_` only if truly public.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes (prod) | `''` | Firebase client API key (public identifier, not a secret) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes (prod) | `''` | Firebase auth domain (e.g., `project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes (prod) | `''` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes (prod) | `''` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes (prod) | `''` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes (prod) | `''` | Firebase app ID |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3011/api/v1` | Backend API base URL |
| `NEXT_PUBLIC_SENTRY_DSN` | No | — | Sentry DSN for error monitoring |

### Frontend `.env.local` Template

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abc123
NEXT_PUBLIC_API_URL=http://localhost:3011/api/v1
```

---

## Backend (`apps/api`)

Backend vars are stored in Railway environment or `.env` locally (never committed).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment: `development`, `staging`, `production` |
| `PORT` | No | `3011` | Server port |
| `FIREBASE_PROJECT_ID` | Yes (prod) | — | Firebase Admin SDK project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes (prod) | — | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Yes (prod) | — | Firebase Admin private key (with `\n` escapes) |
| `ANTHROPIC_API_KEY` | Yes (prod) | — | Anthropic Claude API key (mock mode if absent) |
| `REDIS_URL` | No | — | Upstash Redis URL (for rate limiting, queues) |
| `STRIPE_SECRET_KEY` | Yes (prod) | — | Stripe secret key (sk_live_... or sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Yes (prod) | — | Stripe webhook signing secret (whsec_...) |
| `STRIPE_PRICE_ID_EXPLORER` | Yes (prod) | — | Stripe Price ID for Explorer plan (price_...) |
| `STRIPE_PRICE_ID_CREATOR` | Yes (prod) | — | Stripe Price ID for Creator plan (price_...) |
| `FRONTEND_URL` | No | `http://localhost:3010` | Frontend URL for Stripe redirect URLs |
| `SENTRY_DSN` | No | — | Sentry DSN for error monitoring |

### Backend `.env` Template

```env
NODE_ENV=development
PORT=3011
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_EXPLORER=price_...
STRIPE_PRICE_ID_CREATOR=price_...
FRONTEND_URL=http://localhost:3010
```

---

## Security Notes

1. **NEVER** commit `.env` files to git (covered in `.gitignore`)
2. Backend env vars are **secrets** — store in Railway/GCP Secret Manager
3. Frontend `NEXT_PUBLIC_*` vars are **public** — embedded in client JS bundles
4. Firebase client config is NOT a secret — it's a public identifier
5. The `FIREBASE_PRIVATE_KEY` contains `\n` escape sequences — wrap in double quotes

---

*Last updated: 2026-02-26 | Phase 10 — Stripe integration*
