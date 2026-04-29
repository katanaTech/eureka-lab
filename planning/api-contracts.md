# API Contracts — Eureka-Lab Platform

> **Maintained by ARCH agent. FE and BE agents must not deviate from these contracts.**
> When a contract changes, ARCH increments the version and notifies both FE and BE via a note in planning/blockers.md.

---

## Base URL

- **Development:** `http://localhost:3011/api/v1`
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
  - url: http://localhost:3011/api/v1
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

## OpenAPI 3.0 Spec — Inventory, UI Mode & Character Endpoints (ARCH-002)

> **Status:** PROPOSED | **Version:** 1.0 | **Phase:** 16
> **Plan:** [planning/phase-16-gamified-ui-redesign.md](phase-16-gamified-ui-redesign.md)
> **ADRs:** ADR-002 (paradigm), ADR-003 (KP economy), ADR-004 (UI mode), ADR-005 (mappings)
> **Status will move to ACCEPTED once product owner confirms the open items in Part K of the task board.**

### Endpoint summary

| Method | Path | Auth | Role | Purpose |
|--------|------|:---:|---|---|
| GET    | `/inventory`                  | Yes | Any   | Read current inventory (KP, owned items, equipped weapon) |
| GET    | `/shop/catalog`               | Yes | Any   | Read shop catalog (abilities + weapons) |
| POST   | `/inventory/buy`              | Yes | Any   | Purchase a catalog item (atomic) |
| POST   | `/inventory/equip`            | Yes | Any   | Equip / unequip a weapon |
| GET    | `/users/me/character`         | Yes | Any   | Read fantasy character (game mode identity) |
| PUT    | `/users/me/character`         | Yes | Any   | Create or update fantasy character |
| GET    | `/users/me/settings`          | Yes | Any   | Read user settings (now includes `uiMode`) |
| PUT    | `/users/me/settings`          | Yes | Any   | Update user settings; rejects `uiMode` if tenant-locked |
| GET    | `/tenants/:tenantId/ui-mode`  | Yes | admin | Read tenant UI mode lock |
| PUT    | `/tenants/:tenantId/ui-mode`  | Yes | admin | Set tenant UI mode lock |

### OpenAPI fragment

```yaml
openapi: 3.0.3

paths:

  /inventory:
    get:
      tags: [inventory]
      operationId: getInventory
      summary: Get the authenticated user's inventory
      security: [{ BearerAuth: [] }]
      responses:
        '200':
          description: Current inventory
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Inventory'
              example:
                kp: 320
                totalKpEarned: 1240
                ownedAbilityIds: [focus, surge]
                ownedWeaponIds: [iron-dagger]
                equippedWeaponId: iron-dagger
                updatedAt: '2026-04-25T10:00:00.000Z'
        '401': { $ref: '#/components/responses/UnauthorizedError' }

  /shop/catalog:
    get:
      tags: [inventory]
      operationId: getShopCatalog
      summary: Get the shop catalog (abilities + weapons)
      description: >
        Server-authoritative catalog. Frontend never decides prices or stats — see ADR-003.
        Cacheable for 1 hour at the client (TanStack Query stale-time).
      security: [{ BearerAuth: [] }]
      responses:
        '200':
          description: Catalog
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ShopCatalog'

  /inventory/buy:
    post:
      tags: [inventory]
      operationId: purchaseItem
      summary: Purchase a catalog item (KP debit + ownership credit, atomic)
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/PurchaseItemRequest' }
            example: { itemId: focus, itemType: ability }
      responses:
        '200':
          description: Purchase succeeded
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Inventory' }
        '400': { $ref: '#/components/responses/ValidationError' }
        '402':
          description: Insufficient KP
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
              example:
                statusCode: 402
                error: Payment Required
                message: Not enough Knowledge Points to buy this item
                code: KP_INSUFFICIENT
                timestamp: '2026-04-25T10:00:00.000Z'
        '409':
          description: Already owned
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
              example:
                statusCode: 409
                error: Conflict
                message: Item already owned
                code: ITEM_ALREADY_OWNED
                timestamp: '2026-04-25T10:00:00.000Z'

  /inventory/equip:
    post:
      tags: [inventory]
      operationId: equipWeapon
      summary: Equip or unequip a weapon (pass null weaponId to unequip)
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/EquipWeaponRequest' }
            example: { weaponId: iron-dagger }
      responses:
        '200':
          description: Updated inventory
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Inventory' }
        '400': { $ref: '#/components/responses/ValidationError' }
        '403':
          description: Weapon not owned
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
              example:
                statusCode: 403
                error: Forbidden
                message: You do not own this weapon
                code: WEAPON_NOT_OWNED
                timestamp: '2026-04-25T10:00:00.000Z'

  /users/me/character:
    get:
      tags: [users]
      operationId: getMyCharacter
      summary: Get the authenticated user's fantasy-game character
      security: [{ BearerAuth: [] }]
      responses:
        '200':
          description: Character (404 if not yet created)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/FantasyCharacter' }
        '404':
          description: No character has been created yet for this user
    put:
      tags: [users]
      operationId: upsertMyCharacter
      summary: Create or update the fantasy-game character
      description: >
        Defaults `class` from `users/{uid}.careerArchetype` via FANTASY_CLASS_BY_CAREER
        (ADR-005 §2) when not specified. Class is independent of careerArchetype
        post-creation — see ADR-005 §2.
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UpsertCharacterRequest' }
            example:
              name: Stormrider
              class: mage
              weaponName: Whisper-Ash Staff
      responses:
        '200':
          description: Updated character
          content:
            application/json:
              schema: { $ref: '#/components/schemas/FantasyCharacter' }
        '400': { $ref: '#/components/responses/ValidationError' }

  /users/me/settings:
    put:
      tags: [users]
      operationId: updateMySettings
      summary: Update user settings (Phase 16 adds uiMode field)
      description: >
        Returns 403 with code UI_MODE_LOCKED_BY_TENANT if uiMode is supplied while the user's
        tenant has `uiModeLock.locked === true` — see ADR-004 §5.
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UpdateSettingsRequest' }
            example: { uiMode: gamified }
      responses:
        '200':
          description: Updated settings
        '403':
          description: UI mode locked by tenant
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
              example:
                statusCode: 403
                error: Forbidden
                message: Learning mode is set by your school administrator
                code: UI_MODE_LOCKED_BY_TENANT
                timestamp: '2026-04-25T10:00:00.000Z'

  /tenants/{tenantId}/ui-mode:
    parameters:
      - in: path
        name: tenantId
        required: true
        schema: { type: string }
    get:
      tags: [tenants]
      operationId: getTenantUiModeLock
      security: [{ BearerAuth: [] }]
      responses:
        '200':
          description: Current tenant UI mode lock
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TenantUiModeLock' }
    put:
      tags: [tenants]
      operationId: setTenantUiModeLock
      summary: Set tenant default UI mode and lock state (admin only)
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/TenantUiModeLock' }
            example: { mode: gamified, locked: true }
      responses:
        '200':
          description: Lock updated
        '403': { $ref: '#/components/responses/ForbiddenError' }

components:
  schemas:

    UiMode:
      type: string
      enum: [normal, gamified]
      description: Effective UI mode resolved server-side via UiModeResolver — see ADR-004

    FantasyClass:
      type: string
      enum: [mage, engineer, rogue, warrior]
      description: Cinematic-fantasy character class — see ADR-005 §2

    Inventory:
      type: object
      required: [kp, totalKpEarned, ownedAbilityIds, ownedWeaponIds, equippedWeaponId, updatedAt]
      properties:
        kp:                { type: integer, minimum: 0 }
        totalKpEarned:     { type: integer, minimum: 0 }
        ownedAbilityIds:   { type: array, items: { type: string } }
        ownedWeaponIds:    { type: array, items: { type: string } }
        equippedWeaponId:  { type: string, nullable: true }
        updatedAt:         { type: string, format: date-time }

    ShopAbility:
      type: object
      required: [id, name, icon, damage, cooldown, cost, description]
      properties:
        id:          { type: string }
        name:        { type: string }
        icon:
          type: string
          enum: [sword, spark, brain, shield, zap]
        damage:
          type: array
          minItems: 2
          maxItems: 2
          items: { type: integer, minimum: 0 }
          description: '[min, max] damage range'
        cooldown:    { type: integer, minimum: 0 }
        cost:        { type: integer, minimum: 0, description: KP cost }
        description: { type: string }
        unlockHintZoneId:
          type: string
          nullable: true
          description: Hint about which zone unlocks this ability narratively

    ShopWeapon:
      type: object
      required: [id, name, bonusDamage, cost, description]
      properties:
        id:           { type: string }
        name:         { type: string }
        bonusDamage:  { type: integer, minimum: 0 }
        cost:         { type: integer, minimum: 0 }
        description:  { type: string }
        unlockHintZoneId: { type: string, nullable: true }

    ShopCatalog:
      type: object
      required: [abilities, weapons]
      properties:
        abilities: { type: array, items: { $ref: '#/components/schemas/ShopAbility' } }
        weapons:   { type: array, items: { $ref: '#/components/schemas/ShopWeapon' } }

    PurchaseItemRequest:
      type: object
      required: [itemId, itemType]
      properties:
        itemId:   { type: string }
        itemType:
          type: string
          enum: [ability, weapon]

    EquipWeaponRequest:
      type: object
      required: [weaponId]
      properties:
        weaponId:
          type: string
          nullable: true
          description: Pass null to unequip

    FantasyCharacter:
      type: object
      required: [name, class, classColorHsl, weaponName, createdAt]
      properties:
        name:           { type: string, minLength: 2, maxLength: 30 }
        class:          { $ref: '#/components/schemas/FantasyClass' }
        classColorHsl:  { type: string, description: 'HSL triplet, e.g. "268 70% 60%"' }
        weaponName:     { type: string }
        createdAt:      { type: string, format: date-time }

    UpsertCharacterRequest:
      type: object
      required: [name]
      properties:
        name:        { type: string, minLength: 2, maxLength: 30 }
        class:       { $ref: '#/components/schemas/FantasyClass' }
        weaponName:  { type: string }

    UpdateSettingsRequest:
      type: object
      properties:
        uiMode: { $ref: '#/components/schemas/UiMode' }
        # Future settings fields go here (notifications, accessibility, etc.)

    TenantUiModeLock:
      type: object
      required: [mode, locked]
      properties:
        mode:
          type: string
          nullable: true
          enum: [normal, gamified, null]
        locked: { type: boolean }
```

### Behavior cross-references

- **KP earning** is invoked from existing progress endpoints (`POST /progress/lessons/:id/complete`,
  `POST /combat/:battleId/complete`) — gated by `UiModeResolver` per ADR-003 §2 and ADR-004 §3.
  The KP award is server-side only and surfaces to clients via the next `GET /inventory` fetch
  (TanStack Query invalidates `['inventory']` on these mutations).
- **Daily KP cap** is enforced inside the inventory service per ADR-003 §5; the API surface does
  not change but the response of progress endpoints will contain `kpAwarded: number` (zero when
  capped or in normal mode).
- **`/auth/me`** response is extended to include `effectiveUiMode: UiMode` so the frontend can
  render the correct theme on first paint without a second round-trip.

---

*Version: 1.2 (ARCH-001 complete; ARCH-002 implemented — Sprint A BE done 2026-04-27) | Maintained by: ARCH agent*
*Changes require ARCH approval and must notify FE + BE agents via planning/blockers.md*
