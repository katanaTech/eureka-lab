# ADR-002: AI Gateway Abstraction Pattern

**Date:** Sprint 1
**Status:** Accepted
**Deciders:** ARCH
**Supersedes:** None

---

## Context

The platform requires AI-generated responses for all four learning levels. The naive implementation would have the frontend call the Anthropic Claude API directly from the browser. This approach was evaluated and rejected for the following reasons:

1. **API key exposure** — Anthropic API keys cannot be stored safely in frontend code or client-side environment variables. Any key accessible to the browser is publicly visible.
2. **Child safety bypass** — Direct frontend calls skip the content moderation pipeline (pre-generation and post-generation screening), violating the platform's non-negotiable child safety rules.
3. **Token budget enforcement bypass** — Per-level and per-user daily token limits (L1: 500, L2: 800, L3: 1500, L4: 1000 output tokens) cannot be enforced on the client side.
4. **Audit trail gaps** — All AI interactions must be logged to `moderationLogs` in Firestore. Client-side calls would create unauditable interactions.
5. **Provider lock-in** — Calling Anthropic's SDK directly in frontend or backend service code couples every caller to the Anthropic interface. Switching to a different provider (e.g. OpenAI, Google Gemini) would require changes across the entire codebase.

We evaluated two backend approaches:

| Option | Description |
|--------|-------------|
| Direct SDK calls in controllers | Each NestJS controller imports and calls `@anthropic-ai/sdk` directly |
| Abstraction layer (`AiGatewayService`) | Single service implements a provider-agnostic interface; controllers call the interface |

---

## Decision

All AI API calls go through a single `AiGatewayService` in the NestJS backend, implementing a provider-agnostic TypeScript interface.

### The Interface

```typescript
/**
 * Provider-agnostic interface for AI message generation.
 * All AI calls in the backend must go through an implementation of this interface.
 */
interface AiGatewayService {
  /**
   * Send a message to the AI provider and receive a response.
   * The safety preamble is injected automatically by the implementation.
   * The token budget for the given level is enforced automatically.
   *
   * @param params.prompt - The user's input prompt (already moderation-screened)
   * @param params.systemPrompt - The level-specific system prompt from ai-prompts package
   * @param params.userId - The authenticated user's Firebase UID (for audit logging)
   * @param params.level - The learning level (1–4), used to enforce token budgets
   * @param params.maxTokens - Maximum output tokens; must not exceed the level budget
   * @returns The AI-generated content string and total tokens consumed
   */
  sendMessage(params: {
    prompt: string;
    systemPrompt: string;
    userId: string;
    level: 1 | 2 | 3 | 4;
    maxTokens: number;
  }): Promise<{ content: string; tokensUsed: number }>;
}
```

### Implementation Rules

1. `AiGatewayService` is the **only** class that imports `@anthropic-ai/sdk`. All other NestJS modules call the service through the interface, never the SDK directly.
2. The implementation automatically prepends the child safety preamble from `packages/ai-prompts/safety-preamble.ts` to every system prompt before the API call.
3. The implementation enforces token budgets per level and throws a `TokenBudgetExceededException` if `maxTokens` exceeds the level limit.
4. The implementation writes an audit record to the moderation log after every call (pass or fail).
5. Streaming responses use Server-Sent Events (SSE): the gateway streams from Anthropic → NestJS SSE response → client EventSource.
6. The interface is defined in `packages/shared-types/ai-gateway.ts` so both `apps/api` and future tooling can reference the type contract.

---

## Consequences

### Positive

- All AI calls are **auditable**: the gateway logs every interaction to Firestore `moderationLogs`, regardless of outcome.
- All AI calls are **provider-agnostic**: to switch from Anthropic to another provider, only `AiGatewayService` (one file) changes. All controllers are unaffected.
- **Child safety preamble is always injected**: no caller can accidentally omit it. The gateway enforces it unconditionally.
- **Token budgets are always enforced**: the gateway rejects calls that exceed the per-level budget before the API call is made, preventing cost overruns.
- **API keys never reach the frontend**: the gateway pattern structurally prevents this by keeping all AI calls in the backend.

### Negative

- An additional network hop (frontend → NestJS → Anthropic) adds latency compared to direct calls. Mitigated by streaming (first token arrives quickly) and by the fact that child users are not latency-sensitive in the same way as adult productivity tools.
- NestJS becomes a required component for any AI feature. Local development requires the backend running. Mitigated by a mock `AiGatewayService` implementation for testing (`AiGatewayMockService`).

---

*ADR authored by ARCH agent | See also: ADR-006 (Content Moderation), CLAUDE.md Rule 1 (no frontend AI calls)*
