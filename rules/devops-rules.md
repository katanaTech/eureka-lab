# DevOps & CI/CD Rules — Eureka-lab Platform

> **DEVOPS Agent reads this at the start of every session.**

---

## 1. Repository Structure & Branching

### Branch Strategy

```
main                    ← production (protected, requires PR + CI green)
├── staging             ← staging environment (auto-deploy on push)
└── develop             ← integration branch (all PRs merge here first)
    ├── feature/FE-001-nextjs-scaffold
    ├── feature/BE-001-nestjs-scaffold
    ├── fix/QA-011-role-guard-bug
    └── chore/DEV-005-ci-pipeline
```

**Branch naming:** `[type]/[TASK-ID]-[short-description]`
- Types: `feature`, `fix`, `chore`, `docs`, `refactor`

### PR Rules
- PRs to `develop`: 1 review required, CI must pass
- PRs to `staging`: automated only (from develop via CD)
- PRs to `main`: 1 review + all E2E tests pass + manual approval

---

## 2. Monorepo Setup (Turborepo)

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Package manager:** `pnpm` with workspaces.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 3. GitHub Actions CI Pipeline

Every PR triggers:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [develop, staging, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web test --coverage
      - uses: codecov/codecov-action@v4

  test-backend:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api test --coverage
        env:
          NODE_ENV: test
          REDIS_URL: redis://localhost:6379
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID_TEST }}
      - uses: codecov/codecov-action@v4

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-frontend, test-backend]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

**CI must pass:** lint + unit tests + build, before any PR can merge.

---

## 4. CD Pipeline

### Frontend (Vercel)
Vercel auto-deploys via its GitHub integration:
- Push to `main` → deploy to production
- Push to `staging` → deploy to staging preview URL
- PRs → deploy to ephemeral preview URL (linked in PR comment)

```json
// vercel.json
{
  "buildCommand": "pnpm --filter web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

### Backend (Railway)
```yaml
# railway.toml
[build]
  builder = "nixpacks"
  buildCommand = "pnpm --filter api build"

[deploy]
  startCommand = "pnpm --filter api start:prod"
  healthcheckPath = "/health"
  healthcheckTimeout = 30
  restartPolicyType = "on-failure"
```

---

## 5. Environment Variables Management

### Naming Convention
```
# Frontend (NEXT_PUBLIC_ only for truly public values)
NEXT_PUBLIC_API_URL=https://api.domain.com
NEXT_PUBLIC_FIREBASE_API_KEY=...         # public Firebase config (safe)
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# Backend (never in client code)
ANTHROPIC_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...                 # multiline — encode as base64 in CI
REDIS_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SENTRY_DSN=...
```

### Environment Tiers
| Variable Suffix | Environment | Who Sets It |
|-----------------|-------------|-------------|
| (none) | Production | Railway (API) / Vercel (FE) |
| `_STAGING` | Staging | Railway staging service |
| `_TEST` | CI testing | GitHub Actions secrets |

**Rules:**
- NEVER commit `.env` files with real values to git
- `.env.example` with placeholder values is committed
- Secret rotation: Anthropic and Stripe keys rotated every 90 days

---

## 6. Firebase Setup & Deployment

### Firebase Project Structure
```
firebase/
├── .firebaserc              # Project aliases
├── firebase.json            # Deploy targets
├── firestore.rules          # Security rules
├── firestore.indexes.json   # Composite indexes
└── functions/
    ├── src/
    │   ├── badge-awards.ts
    │   └── parent-notifications.ts
    └── package.json
```

### Deploy Commands
```bash
# Deploy only Firestore rules (safe, no downtime)
firebase deploy --only firestore:rules

# Deploy only functions
firebase deploy --only functions

# Deploy indexes (may take time to build)
firebase deploy --only firestore:indexes
```

**Rule:** Firestore rules are deployed separately from app code. Every rules change requires a QA review of the security test suite.

---

## 7. Firestore Security Rules Template

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    function isParentOf(childUid) {
      return exists(/databases/$(database)/documents/parent_links/$(request.auth.uid))
        && get(/databases/$(database)/documents/parent_links/$(request.auth.uid)).data.childUids.hasAny([childUid]);
    }
    
    function hasRole(role) {
      return request.auth.token.role == role;
    }
    
    function hasAdminRole() {
      return hasRole('admin');
    }

    // Users collection
    match /users/{uid} {
      allow read: if isOwner(uid) || isParentOf(uid) || hasAdminRole();
      allow create: if isAuthenticated() && isOwner(uid);
      allow update: if isOwner(uid) || hasAdminRole();
      allow delete: if hasAdminRole();
    }

    // Progress collection  
    match /progress/{docId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid
        || isParentOf(resource.data.userId)
        || hasAdminRole()
      );
      allow write: if isAuthenticated() && resource == null
        ? request.resource.data.userId == request.auth.uid
        : resource.data.userId == request.auth.uid;
    }

    // Moderation logs — backend write only, parent read
    match /moderation_logs/{logId} {
      allow read: if hasAdminRole() || isParentOf(resource.data.userId);
      allow write: if false;  // Backend only via Admin SDK
    }
  }
}
```

---

## 8. Monitoring & Alerting

### Sentry Setup
```typescript
// Both apps use Sentry
// Frontend: @sentry/nextjs
// Backend: @sentry/nestjs

// Alert rules (configure in Sentry dashboard):
// - Error rate > 1% → immediate Slack alert
// - New unhandled exception → immediate email
// - Performance: P95 latency > 3s → Slack alert
```

### Uptime Monitoring
Use Railway's built-in health checks + Better Uptime (free tier):
- `/health` endpoint checked every 60 seconds
- Alert if down for >2 minutes → email + SMS to founder

### Log Aggregation
- Backend: Pino logs → Railway log viewer (dev/staging) → GCP Cloud Logging (production)
- Frontend: Vercel analytics + Sentry for client errors

---

## 9. Security Hardening

### Vercel Security Headers
```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Required for Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.domain.com wss://api.domain.com https://*.firebaseapp.com",
    ].join('; ')
  },
];
```

### Rate Limiting (Railway + NestJS)
```typescript
// Backend: @nestjs/throttler
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 1000,    // 1 second
  limit: 10,    // 10 requests per second per IP
}, {
  name: 'medium',
  ttl: 60000,   // 1 minute
  limit: 100,   // 100 requests per minute per IP
}])
```

---

*Version: 1.0 | Maintained by: DEVOPS agent | Last updated: Sprint 1*
