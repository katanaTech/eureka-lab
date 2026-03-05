import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 * App will fail to start if required vars are missing.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3011),

  /* Firebase Admin SDK */
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').optional(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().allow('').optional(),

  /* Anthropic Claude API */
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),

  /* Redis (optional in dev) */
  REDIS_URL: Joi.string().allow('').optional(),

  /* Stripe (optional in dev) */
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
});
