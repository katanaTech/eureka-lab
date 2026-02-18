# API Contracts — Eureka-Lab Platform

> **Maintained by ARCH agent. FE and BE agents must not deviate from these contracts.**
> When a contract changes, ARCH increments the version and notifies both FE and BE via a note in planning/blockers.md.

---

## Base URL

- **Development:** `http://localhost:3001/api/v1`
- **Staging:** `https://api-staging.[domain].com/api/v1`
- **Production:** `https://api.[domain].com/api/v1`

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <firebase_id_token>
```

Firebase ID tokens expire after 1 hour. Frontend must refresh via `firebase.auth().currentUser.getIdToken(true)`.

---

## OpenAPI 3.0 Spec — Auth Endpoints (ARCH-001)

> **Status:** ACCEPTED | **Version:** 1.0 | **Sprint:** 1
> This is the authoritative contract. BE implements from this. FE generates typed client from this.

```yaml
openapi: 3.0.3

info:
  title: Eureka-Lab Platform — Auth API
  description: >
    Authentication and account management endpoints for the Eureka-Lab Platform.
    All AI calls are forbidden from frontend — this API is the only gateway.
    Child safety rules are enforced server-side on every request.
  version: 1.0.0
  contact:
    name: ARCH Agent

servers:
  - url: http://localhost:3001/api/v1
    description: Local development
  - url: https://api-staging.{domain}.com/api/v1
    description: Staging
  - url: https://api.{domain}.com/api/v1
    description: Production

tags:
  - name: auth
    description: Authentication and account management

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

paths:

  /auth/signup:
    post:
      tags: [auth]
      operationId: signupParent
      summary: Create a parent account
      description: >
        Registers a new parent account. Parents must complete email verification
        before creating child sub-accounts. Only role 'parent' is accepted here;
        child accounts are created via /auth/add-child.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SignupRequest'
            example:
              email: parent@example.com
              password: SecurePass1
              displayName: Jane Smith
              role: parent
      responses:
        '201':
          description: Account created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SignupResponse'
              example:
                uid: uid_abc123
                email: parent@example.com
                displayName: Jane Smith
                role: parent
                token: eyJhbGci...
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'

  /auth/login:
    post:
      tags: [auth]
      operationId: login
      summary: Exchange Firebase ID token for enriched user profile
      description: >
        The frontend authenticates with Firebase directly (Google OAuth or
        email/password), then sends the resulting Firebase ID token here.
        The backend verifies the token, enriches the profile from Firestore,
        and returns the full user object with role, plan, and XP.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
            example:
              idToken: eyJhbGci...
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /auth/logout:
    post:
      tags: [auth]
      operationId: logout
      summary: Invalidate the current session
      description: >
        Revokes the Firebase refresh token server-side, invalidating all
        sessions for this user. Frontend must also sign out from Firebase SDK.
      security:
        - BearerAuth: []
      responses:
        '204':
          description: Session invalidated — no body returned
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /auth/me:
    get:
      tags: [auth]
      operationId: getMe
      summary: Get the current authenticated user's profile
      description: >
        Returns the full profile for the currently authenticated user.
        For parent accounts, includes the list of child sub-accounts.
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Current user profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MeResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /auth/add-child:
    post:
      tags: [auth]
      operationId: addChildAccount
      summary: Add a child sub-account under the authenticated parent
      description: >
        Creates a child account linked to the authenticated parent's UID.
        Child must be between 8 and 16 years old (enforced by birthYear).
        No personal name or school data is ever sent to external AI APIs (Rule 13).
        Maximum 5 child accounts per parent.
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AddChildRequest'
            example:
              displayName: Alex
              birthYear: 2014
      responses:
        '201':
          description: Child account created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AddChildResponse'
              example:
                uid: uid_child456
                displayName: Alex
                role: child
                age: 11
                parentUid: uid_abc123
                plan: free
        '400':
          $ref: '#/components/responses/ValidationError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '409':
          $ref: '#/components/responses/ConflictError'

  /auth/verify-email:
    post:
      tags: [auth]
      operationId: sendEmailVerification
      summary: Trigger email verification for the authenticated user
      description: >
        Sends a verification email to the authenticated user's address.
        Rate-limited to 3 sends per hour per account.
      security:
        - BearerAuth: []
      responses:
        '204':
          description: Verification email sent
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '429':
          $ref: '#/components/responses/RateLimitError'

  /auth/refresh:
    post:
      tags: [auth]
      operationId: refreshToken
      summary: Refresh the Firebase ID token
      description: >
        Accepts a Firebase refresh token and returns a new ID token.
        Prefer using the Firebase SDK's automatic token refresh on the frontend;
        use this endpoint only for server-side flows or when the SDK is unavailable.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshTokenRequest'
      responses:
        '200':
          description: New ID token issued
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RefreshTokenResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

# ─────────────────────────────────────────────────────────────────────────────
# COMPONENTS
# ─────────────────────────────────────────────────────────────────────────────

components:

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: Firebase ID Token
      description: Firebase ID token obtained from Firebase Auth SDK

  # ── Request Schemas ──────────────────────────────────────────────────────

  schemas:

    SignupRequest:
      type: object
      required: [email, password, displayName, role]
      properties:
        email:
          type: string
          format: email
          example: parent@example.com
        password:
          type: string
          minLength: 8
          description: Min 8 chars, at least 1 uppercase letter and 1 number
          example: SecurePass1
        displayName:
          type: string
          minLength: 2
          maxLength: 50
          example: Jane Smith
        role:
          type: string
          enum: [parent]
          description: Only 'parent' is accepted on direct signup

    SignupResponse:
      type: object
      required: [uid, email, displayName, role, token]
      properties:
        uid:
          type: string
          description: Firebase UID
        email:
          type: string
          format: email
        displayName:
          type: string
        role:
          type: string
          enum: [parent]
        token:
          type: string
          description: Firebase ID token (valid 1 hour)

    LoginRequest:
      type: object
      required: [idToken]
      properties:
        idToken:
          type: string
          description: Firebase ID token obtained from Firebase Auth SDK after sign-in

    LoginResponse:
      type: object
      required: [uid, email, displayName, role, plan, xp]
      properties:
        uid:
          type: string
        email:
          type: string
          format: email
        displayName:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        plan:
          $ref: '#/components/schemas/PlanType'
        xp:
          type: integer
          minimum: 0
        children:
          type: array
          description: Populated only when role is 'parent'
          items:
            $ref: '#/components/schemas/ChildSummary'

    MeResponse:
      type: object
      required: [uid, email, displayName, role, plan, xp, streak]
      properties:
        uid:
          type: string
        email:
          type: string
          format: email
        displayName:
          type: string
        role:
          $ref: '#/components/schemas/UserRole'
        plan:
          $ref: '#/components/schemas/PlanType'
        xp:
          type: integer
          minimum: 0
        streak:
          type: integer
          minimum: 0
          description: Current consecutive-day learning streak
        children:
          type: array
          description: Populated only when role is 'parent'
          items:
            $ref: '#/components/schemas/ChildSummary'

    AddChildRequest:
      type: object
      required: [displayName, birthYear]
      properties:
        displayName:
          type: string
          minLength: 2
          maxLength: 30
          description: >
            Child's preferred display name. NOT their real name —
            never sent to external AI APIs (CLAUDE.md Rule 13).
          example: Alex
        birthYear:
          type: integer
          minimum: 2000
          maximum: 2020
          description: Must result in an age between 8 and 16

    AddChildResponse:
      type: object
      required: [uid, displayName, role, age, parentUid, plan]
      properties:
        uid:
          type: string
        displayName:
          type: string
        role:
          type: string
          enum: [child]
        age:
          type: integer
          minimum: 8
          maximum: 16
        parentUid:
          type: string
        plan:
          type: string
          enum: [free]
          description: New child accounts always start on the free plan

    RefreshTokenRequest:
      type: object
      required: [refreshToken]
      properties:
        refreshToken:
          type: string
          description: Firebase refresh token

    RefreshTokenResponse:
      type: object
      required: [idToken, expiresIn]
      properties:
        idToken:
          type: string
          description: New Firebase ID token (valid 1 hour)
        expiresIn:
          type: integer
          description: Seconds until expiry (always 3600)
          example: 3600

    ChildSummary:
      type: object
      required: [uid, displayName, age, plan, xp]
      properties:
        uid:
          type: string
        displayName:
          type: string
        age:
          type: integer
        plan:
          $ref: '#/components/schemas/PlanType'
        xp:
          type: integer

    UserRole:
      type: string
      enum: [child, parent, teacher, admin]
      description: >
        child — learner account (created by parent via /auth/add-child);
        parent — account holder who manages child accounts;
        teacher — B2B classroom account (Phase 2);
        admin — platform admin

    PlanType:
      type: string
      enum: [free, explorer, creator]
      description: >
        free — Level 1 modules 1–5 only, 20 AI prompts/day;
        explorer — All Level 1 + Level 2, 100 AI prompts/day;
        creator — All levels, unlimited AI prompts

    ErrorResponse:
      type: object
      required: [statusCode, error, message, timestamp]
      properties:
        statusCode:
          type: integer
          example: 400
        error:
          type: string
          example: Bad Request
        message:
          type: string
          example: Validation failed
        code:
          type: string
          description: Machine-readable error code
          example: EMAIL_ALREADY_EXISTS
        errors:
          type: array
          description: Field-level validation errors (400 only)
          items:
            type: object
            required: [field, message]
            properties:
              field:
                type: string
                example: password
              message:
                type: string
                example: Password must contain at least one uppercase letter
        timestamp:
          type: string
          format: date-time
          example: '2026-02-18T10:00:00.000Z'

  # ── Reusable Responses ───────────────────────────────────────────────────

  responses:

    ValidationError:
      description: Request body failed validation
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 400
            error: Bad Request
            message: Validation failed
            errors:
              - field: password
                message: Password must contain at least one uppercase letter and one number
            timestamp: '2026-02-18T10:00:00.000Z'

    UnauthorizedError:
      description: Missing or invalid Firebase ID token
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 401
            error: Unauthorized
            message: Invalid or expired token
            code: TOKEN_INVALID
            timestamp: '2026-02-18T10:00:00.000Z'

    ForbiddenError:
      description: Authenticated but not permitted (wrong role or plan)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 403
            error: Forbidden
            message: Only parent accounts can add child accounts
            code: ROLE_REQUIRED
            timestamp: '2026-02-18T10:00:00.000Z'

    ConflictError:
      description: Resource already exists or limit reached
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 409
            error: Conflict
            message: Email address is already registered
            code: EMAIL_ALREADY_EXISTS
            timestamp: '2026-02-18T10:00:00.000Z'

    RateLimitError:
      description: Too many requests
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            statusCode: 429
            error: Too Many Requests
            message: Rate limit exceeded. Try again in 60 seconds.
            code: RATE_LIMIT_EXCEEDED
            timestamp: '2026-02-18T10:00:00.000Z'
```

---

## Auth Endpoint Summary

| Method | Path | Auth Required | Role | Description |
|--------|------|:---:|------|-------------|
| POST | `/auth/signup` | No | — | Create parent account |
| POST | `/auth/login` | No | — | Exchange Firebase token for profile |
| POST | `/auth/logout` | Yes | Any | Revoke session |
| GET | `/auth/me` | Yes | Any | Get own profile |
| POST | `/auth/add-child` | Yes | `parent` | Create child sub-account |
| POST | `/auth/verify-email` | Yes | Any | Send email verification |
| POST | `/auth/refresh` | No | — | Refresh ID token |

---

## AI Endpoints

### POST /ai/prompt (Level 1)
Submit a prompt and receive an AI response.

**Request:**
```typescript
{
  moduleId: string;       // e.g., 'l1-m1-what-is-a-prompt'
  prompt: string;         // max 500 chars
  context?: string;       // optional additional context
}
```

**Response 200 (streaming SSE):**
```
Content-Type: text/event-stream

data: {"type":"token","content":"Hello"}
data: {"type":"token","content":" there"}
data: {"type":"done","promptScore":0.78,"tokensUsed":124}
data: {"type":"error","code":"MODERATION_BLOCKED","message":"..."}
```

**Errors:**
- `402` — Token budget exceeded for today
- `403` — Module locked (plan required)
- `429` — Rate limit exceeded (20 req/day free tier)

---

### GET /modules
List all modules the user has access to.

**Query Params:**
```typescript
{
  level?: 1 | 2 | 3 | 4;
  status?: 'locked' | 'available' | 'in_progress' | 'completed';
}
```

**Response 200:**
```typescript
{
  modules: Array<{
    id: string;
    level: number;
    title: string;
    description: string;
    estimatedMinutes: number;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    requiredPlan: 'free' | 'explorer' | 'creator';
    xpReward: number;
  }>;
}
```

---

### GET /modules/:id
Get a single module with full content.

**Response 200:**
```typescript
{
  id: string;
  level: number;
  title: string;
  description: string;
  objectives: string[];
  activities: Activity[];
  status: ModuleStatus;
  progress?: {
    currentActivity: number;
    completedActivities: number[];
    score: number;
  };
}
```

---

### POST /progress/:moduleId/complete
Mark a module activity as complete.

**Request:**
```typescript
{
  activityIndex: number;
  response?: string;      // child's response (for reflection activities)
  score?: number;         // 0–1 if auto-graded
}
```

**Response 200:**
```typescript
{
  xpAwarded: number;
  badgesUnlocked: Badge[];
  moduleCompleted: boolean;
  nextModuleId?: string;
}
```

---

## Progress & Profile Endpoints

### GET /profile
Get current user's full profile.

**Response 200:**
```typescript
{
  uid: string;
  displayName: string;
  role: UserRole;
  plan: Plan;
  xp: number;
  level: number;          // derived from xp
  streak: number;
  badges: Badge[];
  progress: ModuleProgress[];
}
```

---

### GET /parent/dashboard
Parent-only: view all children's progress.

**Response 200:**
```typescript
{
  children: Array<{
    uid: string;
    displayName: string;
    xp: number;
    streak: number;
    lastActive: string;   // ISO date
    modulesCompleted: number;
    weeklyActivity: DayActivity[];
    recentFlags: ModerationFlag[];  // flagged AI interactions
  }>;
}
```

---

## Shared Types

These types are in `packages/shared-types/src/index.ts`:

```typescript
export type UserRole = 'child' | 'parent' | 'teacher' | 'admin';
export type PlanType = 'free' | 'explorer' | 'creator';
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type ModerationFlag = {
  id: string;
  timestamp: string;
  flagType: 'harmful' | 'adult' | 'pii' | 'off_topic' | 'jailbreak';
  severity: 'low' | 'medium' | 'high';
  reviewStatus: 'pending' | 'reviewed' | 'dismissed';
};
```

---

## Error Response Format

All error responses follow this structure:
```typescript
{
  statusCode: number;
  error: string;          // HTTP status text
  message: string;        // Human-readable message
  errors?: Array<{        // Validation errors only
    field: string;
    message: string;
  }>;
  code?: string;          // Machine-readable error code
  timestamp: string;      // ISO datetime
}
```

---

*Version: 1.0 (ARCH-001 complete) | Maintained by: ARCH agent*
*Changes require ARCH approval and must notify FE + BE agents via planning/blockers.md*
