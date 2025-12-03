import * as Joi from 'joi';

/**
 * Environment Variable Validation Schema
 *
 * Validates all environment variables using Joi.
 * Provides clear error messages and type coercion.
 */
export const databaseValidationSchema = Joi.object({
  // Required variables
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required()
    .messages({
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL connection string',
      'any.required': 'DATABASE_URL is required',
    }),

  // Optional variables with defaults
  DB_POOL_LIMIT: Joi.number().integer().positive().default(10).messages({
    'number.base': 'DB_POOL_LIMIT must be a number',
    'number.positive': 'DB_POOL_LIMIT must be positive',
  }),

  DB_POOL_TIMEOUT: Joi.number().integer().positive().default(20).messages({
    'number.base': 'DB_POOL_TIMEOUT must be a number',
    'number.positive': 'DB_POOL_TIMEOUT must be positive',
  }),

  DB_PREPARED_STATEMENTS: Joi.boolean().default(false).messages({
    'boolean.base': 'DB_PREPARED_STATEMENTS must be a boolean',
  }),

  DB_LOGGING: Joi.boolean().default(false).messages({
    'boolean.base': 'DB_LOGGING must be a boolean',
  }),

  DB_SSL: Joi.boolean().default(false).messages({
    'boolean.base': 'DB_SSL must be a boolean',
  }),

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV must be one of: development, production, test',
    }),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.min': 'JWT_SECRET must be at least 16 characters long',
    'any.required': 'JWT_SECRET is required',
  }),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN must be in format: number followed by s/m/h/d (e.g., "7d", "1h", "30m")',
    }),

  JWT_DEBUG: Joi.boolean().default(false).messages({
    'boolean.base': 'JWT_DEBUG must be a boolean',
  }),

  // Application Configuration
  PORT: Joi.number().integer().positive().default(3000).messages({
    'number.base': 'PORT must be a number',
    'number.positive': 'PORT must be positive',
  }),
});

/**
 * Validate environment variables
 */
export function validateDatabaseConfig(env: Record<string, unknown>) {
  const { error, value } = databaseValidationSchema.validate(env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details
      .map((detail) => detail.message)
      .join(', ');
    throw new Error(`Environment variable validation failed: ${errorMessages}`);
  }

  return value;
}
