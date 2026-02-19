# Firestore Schema — Eureka-Lab Platform

> Maintained by ARCH agent.
> All schema changes require a migration file and ARCH agent approval (ADR entry).
> **Never query without a `userId` filter. No unbounded collection reads.**

---

## Collections

### 1. `users/{userId}`

Top-level collection. One document per authenticated user.

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Firebase Auth UID — matches the document ID |
| `email` | `string` | User email address (hashed before use in AI prompts) |
| `role` | `'child' \| 'parent' \| 'teacher' \| 'admin'` | Access control role, set via Firebase custom claims |
| `plan` | `'free' \| 'explorer' \| 'creator'` | Subscription plan tier |
| `createdAt` | `Timestamp` | Account creation timestamp |
| `updatedAt` | `Timestamp` | Last profile update timestamp |

**Example document path:** `users/abc123uid`

**Access rules:**
- Read: `request.auth.uid == userId`
- Write: `request.auth.uid == userId` (role and plan fields: admin only)

---

### 2. `users/{userId}/progress/{moduleId}`

Subcollection on each user document. Tracks learning progress per module.

| Field | Type | Description |
|-------|------|-------------|
| `moduleId` | `string` | Matches the document ID — unique identifier for the learning module |
| `level` | `1 \| 2 \| 3 \| 4` | Which learning level this module belongs to |
| `completedAt` | `Timestamp \| null` | When the module was completed; null if in progress |
| `score` | `number` | Prompt quality score (0–100) awarded on completion |
| `promptPortfolio` | `PromptEntry[]` | Array of saved prompt/response pairs from the module |

**`PromptEntry` shape:**
```typescript
interface PromptEntry {
  promptText: string;
  responseText: string;
  qualityScore: number;
  savedAt: Timestamp;
}
```

**Example document path:** `users/abc123uid/progress/module-01`

**Access rules:**
- Read: `request.auth.uid == userId`
- Write: `request.auth.uid == userId`
- No cross-user reads permitted under any circumstances

---

### 3. `users/{userId}/sessions/{sessionId}`

Subcollection tracking individual AI interaction sessions for token auditing.

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | `string` | Matches the document ID — UUID generated server-side |
| `startedAt` | `Timestamp` | When the session was initiated |
| `endedAt` | `Timestamp \| null` | When the session was closed; null if still active |
| `tokensUsed` | `number` | Total tokens consumed in this session (input + output) |

**Example document path:** `users/abc123uid/sessions/session-uuid-v4`

**Access rules:**
- Read: `request.auth.uid == userId`
- Write: Backend only (service account). Users cannot write session records directly.

---

### 4. `moderationLogs/{logId}`

Top-level collection. Stores moderation audit records for every AI interaction.
Child PII is never stored here — user identity is stored as a hashed value only.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | SHA-256 hash of the Firebase UID — never the raw UID |
| `inputHash` | `string` | SHA-256 hash of the user's input prompt |
| `outputHash` | `string` | SHA-256 hash of the AI response |
| `flagged` | `boolean` | Whether moderation flagged this interaction |
| `flagReason` | `string \| null` | Human-readable reason if flagged; null if clean |
| `timestamp` | `Timestamp` | When the moderation check occurred |

**Example document path:** `moderationLogs/log-uuid-v4`

**Access rules:**
- Read: Admin role only (`request.auth.token.role == 'admin'`)
- Write: Backend only (service account)
- No end-user read or write access

---

## Security Principles

1. **Authentication required for all reads and writes.**
   Every Firestore security rule must begin with `request.auth != null`.

2. **UserId must match the authenticated user.**
   For `users/{userId}` and all subcollections, every rule must assert:
   `request.auth.uid == userId`

3. **No cross-user reads.**
   No rule may allow a user to read another user's documents. Parent–child relationships are managed via Firebase custom claims (`parentUid`), not via Firestore rules that grant cross-user reads.

4. **Backend-only collections.**
   `moderationLogs` is write-restricted to the Firebase Admin service account only.
   Session records in `users/{userId}/sessions` are also write-restricted to the backend.

5. **No unbounded collection reads.**
   All queries must include a `userId` filter and a limit clause. Firestore rules must reject queries that attempt to list documents without matching the authenticated user's UID.

6. **Schema validation before write.**
   The backend `UsersService` must run a schema validation function before writing any child user data to Firestore (Rule 5 from CLAUDE.md).

---

## Indexing Notes

- `users/{userId}/progress` — composite index on `(level ASC, completedAt DESC)` for querying progress by level.
- `moderationLogs` — composite index on `(timestamp DESC, flagged ASC)` for the admin moderation dashboard query.
- Indexes must be defined in `infrastructure/firebase/firestore.indexes.json` before deploying.

---

*Version: 1.0 | Maintained by: ARCH agent | Last updated: Sprint 2*
*Schema changes require ADR entry and migration file.*
