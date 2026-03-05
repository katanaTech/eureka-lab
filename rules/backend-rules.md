# Backend Development Rules — Eureka-lab Platform

> **BE Agent reads this at the start of every session. These rules are enforced in CI.**

---

## 1. Project Structure

```
apps/api/
├── src/
│   ├── main.ts                 # Fastify bootstrap
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   ├── config.module.ts    # ConfigModule setup
│   │   └── env.validation.ts   # Joi/class-validator env schema
│   ├── common/
│   │   ├── decorators/         # Custom decorators (e.g., @CurrentUser)
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Auth guard, role guard, plan guard
│   │   ├── interceptors/       # Logging, response transform
│   │   ├── pipes/              # Validation pipe
│   │   └── dto/                # Shared DTOs
│   ├── modules/
│   │   ├── auth/               # Auth module
│   │   ├── users/              # Users module
│   │   ├── ai-gateway/         # AI abstraction module
│   │   ├── moderation/         # Content moderation module
│   │   ├── modules-content/    # Learning modules module
│   │   ├── progress/           # Progress tracking module
│   │   ├── gamification/       # XP + badges module
│   │   ├── payments/           # Stripe integration module
│   │   └── parent/             # Parent dashboard module
│   └── infrastructure/
│       ├── firebase/           # Firebase Admin setup
│       ├── redis/              # Redis/BullMQ setup
│       └── logger/             # Pino logger service
├── test/
│   ├── unit/                   # Unit tests (co-located is also fine)
│   └── e2e/                    # E2E / integration tests
└── firebase/
    ├── firestore.rules
    ├── firestore.indexes.json
    └── functions/
```

---

## 2. Module Structure Pattern

Every NestJS module follows this exact pattern:

```typescript
// modules/users/
//   users.module.ts
//   users.controller.ts
//   users.service.ts
//   users.repository.ts    ← Firestore access layer
//   dto/
//     create-user.dto.ts
//     update-user.dto.ts
//   users.controller.spec.ts
//   users.service.spec.ts
```

**Rule:** Controllers handle HTTP only (routing, validation, response shaping).
Services contain business logic. Repositories contain all Firestore queries.

---

## 3. Controller Pattern

```typescript
@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get the authenticated user's full profile.
   * @param user - Injected by CurrentUser decorator
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.uid);
  }
}
```

**Never:**
```typescript
// ❌ Business logic in controller
@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  const docRef = firestore.collection('users').doc(user.uid);  // NO
  const doc = await docRef.get();
  return doc.data();
}
```

---

## 4. DTO Validation (ALL input must be validated)

```typescript
// dto/submit-prompt.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPromptDto {
  @ApiProperty({ description: 'Module ID', example: 'l1-m1-what-is-a-prompt' })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({ description: 'User prompt text', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prompt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  context?: string;
}
```

**Every endpoint must:**
1. Accept a typed DTO class decorated with `class-validator` decorators
2. Use `@ApiProperty()` for Swagger documentation
3. The global `ValidationPipe` (set in main.ts) auto-validates all DTOs

---

## 5. AI Gateway — Critical Security Rules

The AI gateway is the most security-sensitive module. These rules are ABSOLUTE:

```typescript
// ai-gateway/ai-gateway.service.ts

@Injectable()
export class AiGatewayService {
  /**
   * Route all AI API calls through this method ONLY.
   * Direct Anthropic SDK usage outside this service is FORBIDDEN.
   */
  async generateResponse(request: AiRequest): Promise<AiResponse> {
    // Step 1: ALWAYS validate and sanitise input first
    const sanitisedPrompt = await this.moderationService.screenInput(request.prompt);
    if (!sanitisedPrompt.isAllowed) {
      throw new ModerationBlockedException(sanitisedPrompt.reason);
    }

    // Step 2: ALWAYS enforce token budget
    await this.tokenBudgetService.checkAndDeduct(request.userId, request.level);

    // Step 3: NEVER include child PII in the API call
    const safeRequest = this.stripPII(request);

    // Step 4: Call Anthropic API
    const rawResponse = await this.anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: TOKEN_LIMITS[request.level],  // enforced here
      system: this.buildSystemPrompt(request.level, request.moduleId),
      messages: [{ role: 'user', content: safeRequest.prompt }],
    });

    // Step 5: ALWAYS screen output before returning
    const screenedResponse = await this.moderationService.screenOutput(rawResponse.content[0].text);

    // Step 6: ALWAYS log the interaction
    await this.moderationLogService.log({
      userId: request.userId,
      prompt: safeRequest.prompt,
      response: screenedResponse.text,
      flagged: screenedResponse.flagged,
    });

    if (screenedResponse.flagged) {
      throw new ModerationBlockedException('Output failed safety screening');
    }

    return screenedResponse;
  }
}
```

### Token Limits (HARDCODED — do not make these configurable by users)

```typescript
// ai-gateway/constants/token-limits.ts
export const TOKEN_LIMITS: Record<number, number> = {
  1: 500,   // Level 1: Prompt literacy
  2: 800,   // Level 2: Workflow automation
  3: 1500,  // Level 3: Vibe coding
  4: 1000,  // Level 4: Buddy agents
} as const;
```

---

## 6. Firestore Repository Pattern

```typescript
// users/users.repository.ts
@Injectable()
export class UsersRepository {
  private readonly collection = 'users';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get user by UID. Returns null if not found.
   * NEVER queries without userId — no unbounded reads.
   */
  async findByUid(uid: string): Promise<UserDoc | null> {
    const docRef = this.firebase.firestore
      .collection(this.collection)
      .doc(uid);    // Always by UID — never scan full collection
    
    const doc = await docRef.get();
    return doc.exists ? (doc.data() as UserDoc) : null;
  }

  /**
   * Create a new user document.
   * Validates schema before writing.
   */
  async create(uid: string, data: CreateUserData): Promise<void> {
    // Validate before write
    const validated = validateUserData(data);
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .set({ ...validated, createdAt: FieldValue.serverTimestamp() });
  }
}
```

**Firestore Rules:**
- No collection reads (`.collection('x').get()`) — always use doc-level reads or indexed queries
- Always include `userId` in where clauses for child queries
- All writes go through the repository class — never directly in services

---

## 7. Error Handling

```typescript
// Use NestJS built-in exceptions + custom ones
throw new NotFoundException('Module not found');
throw new ForbiddenException('Access requires Creator plan');
throw new BadRequestException({
  message: 'Validation failed',
  errors: [{ field: 'prompt', message: 'Prompt cannot be empty' }],
});

// Custom exceptions for domain errors
export class ModerationBlockedException extends HttpException {
  constructor(reason: string) {
    super({ message: 'Content blocked by safety filter', reason, code: 'MODERATION_BLOCKED' }, 422);
  }
}

export class TokenBudgetExceededException extends HttpException {
  constructor() {
    super({ message: 'Daily AI usage limit reached', code: 'TOKEN_BUDGET_EXCEEDED' }, 402);
  }
}
```

**Global exception filter** (`common/filters/all-exceptions.filter.ts`) catches all unhandled exceptions and:
1. Logs them via Pino with request context
2. Returns the standard error response format (defined in api-contracts.md)
3. Never exposes stack traces in production

---

## 8. Logging

```typescript
// ALWAYS use the logger service — NEVER console.log
@Injectable()
export class SomeService {
  private readonly logger = new Logger(SomeService.name);

  async doSomething(): Promise<void> {
    this.logger.log('Starting operation');                    // info
    this.logger.warn('Unusual condition detected');           // warn
    this.logger.error('Operation failed', error.stack);       // error
  }
}
```

**Log structured data, not strings:**
```typescript
// ✅ CORRECT — structured, searchable in GCP/Firebase
this.logger.log({ event: 'ai_call', userId, moduleId, tokensUsed, latencyMs });

// ❌ WRONG — unstructured
this.logger.log(`User ${userId} used ${tokensUsed} tokens`);
```

---

## 9. Environment Variables

All env vars are typed and validated at startup via `config/env.validation.ts`:

```typescript
// config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().default(3001),
  ANTHROPIC_API_KEY: Joi.string().required(),
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
});
```

**Rules:**
- If a required env var is missing, the app MUST fail to start (Joi ensures this)
- Never use `process.env.X` directly in services — always inject via `ConfigService`
- All secrets go in Railway environment variables — never in `.env` files committed to git

---

## 10. Testing Requirements

Every module must have:

**Unit tests (co-located `*.spec.ts`):**
- Service methods tested with mocked dependencies
- Repository methods tested with mocked Firebase
- Guard/decorator tests

**Integration tests (`test/e2e/`):**
- Full request → response flow per endpoint
- Auth guard enforcement (401 on missing token)
- Role guard enforcement (403 for wrong role)
- Validation (400 for invalid input)

**Minimum coverage:** 80% line coverage for all new code.

```typescript
// users.service.spec.ts pattern
describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: { findByUid: jest.fn(), create: jest.fn() } },
      ],
    }).compile();
    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should return user profile', async () => {
    repository.findByUid.mockResolvedValue(mockUser);
    const result = await service.getProfile('uid-123');
    expect(result).toMatchObject({ uid: 'uid-123' });
  });

  it('should throw NotFoundException if user does not exist', async () => {
    repository.findByUid.mockResolvedValue(null);
    await expect(service.getProfile('uid-999')).rejects.toThrow(NotFoundException);
  });
});
```

---

*Version: 1.0 | Maintained by: ARCH agent | Last updated: Sprint 1*
