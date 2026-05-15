import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CORS_ORIGIN: Joi.string().optional(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  GOOGLE_CLIENT_ID: Joi.string().required(),

  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),

  GCS_PROJECT_ID: Joi.string().required(),
  GCS_BUCKET_NAME: Joi.string().required(),
  GCS_CLIENT_EMAIL: Joi.string().required(),
  GCS_PRIVATE_KEY: Joi.string().required(),

  RESEND_API_KEY: Joi.string().required(),

  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),
})