import * as Joi from 'joi';

/**
 * Joi schema for environment variable validation.
 * The app will REFUSE to start if any required variable is missing.
 * Add new variables here as new modules are introduced.
 *
 * Firebase vars added in BE-002.
 * Redis vars added when BullMQ is wired (BE sprint 3).
 */
export const envValidationSchema = Joi.object({
  // ── Runtime ────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3001),

  // ── CORS ───────────────────────────────────────────────────────
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  // ── Anthropic (required in all environments except test) ───────
  ANTHROPIC_API_KEY: Joi.when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('sk-ant-test-key'),
    otherwise: Joi.string().required(),
  }),

  // ── Firebase Admin SDK (required; wired in BE-002) ─────────────
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),
  FIREBASE_PRIVATE_KEY_BASE64: Joi.string().required(),

  // ── Redis (required; wired in Sprint 3) ───────────────────────
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),

  // ── Email ─────────────────────────────────────────────────────
  RESEND_API_KEY: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),

  // ── Monitoring ────────────────────────────────────────────────
  SENTRY_DSN: Joi.string().uri().optional(),
});
