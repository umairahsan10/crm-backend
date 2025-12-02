import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Database Configuration Interface
 *
 * Defines the structure for database connection configuration including:
 * - Runtime connection (PgBouncer) for application queries
 * - Direct connection for migrations
 * - Connection pooling parameters
 * - SSL and logging settings
 * - Health check interval
 */
export interface DatabaseConfig {
  url: string;
  directUrl: string;
  poolConfig: {
    connectionLimit: number;
    poolTimeout: number;
    statement: {
      prepared: boolean;
    };
  };
  logging: boolean;
  ssl: boolean;
  environment: 'development' | 'production' | 'test';
  healthCheckInterval: number; // Health check interval in milliseconds
}

/**
 * Database Configuration Service
 *
 * Provides type-safe, validated database configuration from environment variables.
 * Handles:
 * - Environment variable loading and validation
 * - Default value assignment
 * - Configuration transformation
 * - Environment-specific overrides
 */
@Injectable()
export class DatabaseConfigService {
  private readonly logger = new Logger(DatabaseConfigService.name);
  private config: DatabaseConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Get the complete database configuration
   */
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  /**
   * Get the runtime database URL (PgBouncer)
   */
  getRuntimeUrl(): string {
    return this.buildRuntimeUrl();
  }

  /**
   * Get the direct database URL (for migrations)
   */
  getDirectUrl(): string {
    return this.config.directUrl;
  }

  /**
   * Check if SSL is enabled
   */
  isSslEnabled(): boolean {
    return this.config.ssl;
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.config.logging;
  }

  /**
   * Get the current environment
   */
  getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Get the health check interval in milliseconds
   *
   * This is the interval at which PrismaService performs health checks
   * on the database connection (development mode only).
   *
   * @returns Health check interval in milliseconds
   */
  getHealthCheckInterval(): number {
    return this.config.healthCheckInterval;
  }

  /**
   * Load and parse configuration from environment variables
   */
  private loadConfig(): DatabaseConfig {
    const environment = (this.configService.get<string>('NODE_ENV') ||
      'development') as 'development' | 'production' | 'test';
    const isProduction = environment === 'production';

    // Load required environment variables
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const directDatabaseUrl = this.configService.get<string>(
      'DIRECT_DATABASE_URL',
    );

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    if (!directDatabaseUrl) {
      throw new Error('DIRECT_DATABASE_URL environment variable is required');
    }

    // Load optional configuration with defaults
    const connectionLimit = this.parsePositiveInt(
      this.configService.get<string>('DB_POOL_LIMIT'),
      isProduction ? 20 : 10,
    );

    const poolTimeout = this.parsePositiveInt(
      this.configService.get<string>('DB_POOL_TIMEOUT'),
      isProduction ? 30 : 20,
    );

    const preparedStatements = this.parseBoolean(
      this.configService.get<string>('DB_PREPARED_STATEMENTS'),
      false, // Always false for PgBouncer
    );

    const logging = this.parseBoolean(
      this.configService.get<string>('DB_LOGGING'),
      !isProduction, // Log in development, not in production
    );

    const ssl = this.parseBoolean(
      this.configService.get<string>('DB_SSL'),
      isProduction, // SSL required in production
    );

    // Health check interval (in milliseconds)
    // Default: 60 seconds (60000ms)
    // Minimum: 10 seconds (10000ms) to prevent excessive database queries
    // Maximum: 5 minutes (300000ms) to ensure reasonable monitoring
    const healthCheckInterval = this.parseHealthCheckInterval(
      this.configService.get<string>('DB_HEALTH_CHECK_INTERVAL'),
      60000, // Default: 60 seconds
    );

    return {
      url: databaseUrl,
      directUrl: directDatabaseUrl,
      poolConfig: {
        connectionLimit,
        poolTimeout,
        statement: {
          prepared: preparedStatements,
        },
      },
      logging,
      ssl,
      environment,
      healthCheckInterval,
    };
  }

  /**
   * Build the runtime database URL with PgBouncer parameters
   */
  private buildRuntimeUrl(): string {
    const baseUrl = this.config.url;
    const params = new URLSearchParams();

    // PgBouncer configuration
    params.set('pgbouncer', 'true');
    params.set(
      'prepared_statements',
      String(this.config.poolConfig.statement.prepared),
    );
    params.set(
      'connection_limit',
      String(this.config.poolConfig.connectionLimit),
    );
    params.set('pool_timeout', String(this.config.poolConfig.poolTimeout));

    // SSL configuration
    if (this.config.ssl) {
      params.set('sslmode', 'require');
    }

    // Parse existing URL and merge parameters
    try {
      const url = new URL(baseUrl);
      const existingParams = new URLSearchParams(url.search);

      // Merge parameters (new params override existing)
      existingParams.forEach((value, key) => {
        if (!params.has(key)) {
          params.set(key, value);
        }
      });

      url.search = params.toString();
      return url.toString();
    } catch (error) {
      // If URL parsing fails, append parameters manually
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${params.toString()}`;
    }
  }

  /**
   * Validate the configuration
   */
  private validateConfig(): void {
    this.validateUrl(this.config.url, 'DATABASE_URL');
    this.validateUrl(this.config.directUrl, 'DIRECT_DATABASE_URL');

    // Validate pool configuration
    if (this.config.poolConfig.connectionLimit <= 0) {
      throw new Error('DB_POOL_LIMIT must be a positive integer');
    }

    if (this.config.poolConfig.poolTimeout <= 0) {
      throw new Error('DB_POOL_TIMEOUT must be a positive integer');
    }

    // Validate health check interval
    if (this.config.healthCheckInterval < 10000) {
      throw new Error(
        'DB_HEALTH_CHECK_INTERVAL must be at least 10000ms (10 seconds)',
      );
    }

    if (this.config.healthCheckInterval > 300000) {
      throw new Error(
        'DB_HEALTH_CHECK_INTERVAL must be at most 300000ms (5 minutes)',
      );
    }

    // Validate environment-specific constraints
    if (this.config.environment === 'production') {
      if (!this.config.ssl) {
        this.logger.warn('⚠️  SSL is recommended in production environment');
      }

      // Validate production URLs don't point to localhost
      if (
        this.config.url.includes('localhost') ||
        this.config.url.includes('127.0.0.1')
      ) {
        this.logger.warn(
          '⚠️  Production DATABASE_URL should not point to localhost',
        );
      }

      if (
        this.config.directUrl.includes('localhost') ||
        this.config.directUrl.includes('127.0.0.1')
      ) {
        this.logger.warn(
          '⚠️  Production DIRECT_DATABASE_URL should not point to localhost',
        );
      }
    }

    // Validate PgBouncer configuration
    if (
      !this.config.url.includes('pgbouncer=true') &&
      !this.config.url.includes(':6543')
    ) {
      this.logger.warn(
        '⚠️  DATABASE_URL should point to PgBouncer (port 6543) for connection pooling',
      );
    }

    // Validate direct connection
    if (!this.config.directUrl.includes(':5432')) {
      this.logger.warn(
        '⚠️  DIRECT_DATABASE_URL should point to direct PostgreSQL (port 5432) for migrations',
      );
    }

    this.logger.log('✅ Database configuration validated successfully');
  }

  /**
   * Validate database URL format
   */
  private validateUrl(url: string, name: string): void {
    if (!url) {
      throw new Error(`${name} is required`);
    }

    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error(
        `${name} must be a valid PostgreSQL connection string (postgresql:// or postgres://)`,
      );
    }

    try {
      new URL(url);
    } catch (error) {
      throw new Error(`${name} is not a valid URL: ${error.message}`);
    }
  }

  /**
   * Parse a positive integer from string
   */
  private parsePositiveInt(
    value: string | undefined,
    defaultValue: number,
  ): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      this.logger.warn(
        `Invalid value "${value}", using default: ${defaultValue}`,
      );
      return defaultValue;
    }

    return parsed;
  }

  /**
   * Parse a boolean from string
   */
  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean,
  ): boolean {
    if (!value) {
      return defaultValue;
    }

    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }

    this.logger.warn(
      `Invalid boolean value "${value}", using default: ${defaultValue}`,
    );
    return defaultValue;
  }

  /**
   * Parse health check interval from string (in milliseconds)
   *
   * Validates that the interval is within reasonable bounds:
   * - Minimum: 10000ms (10 seconds) to prevent excessive queries
   * - Maximum: 300000ms (5 minutes) to ensure reasonable monitoring
   *
   * @param value - String value from environment variable
   * @param defaultValue - Default value in milliseconds (default: 60000)
   * @returns Parsed interval in milliseconds
   */
  private parseHealthCheckInterval(
    value: string | undefined,
    defaultValue: number = 60000,
  ): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      this.logger.warn(
        `Invalid health check interval "${value}", using default: ${defaultValue}ms`,
      );
      return defaultValue;
    }

    // Validate bounds
    const minInterval = 10000; // 10 seconds
    const maxInterval = 300000; // 5 minutes

    if (parsed < minInterval) {
      this.logger.warn(
        `Health check interval ${parsed}ms is too low (minimum: ${minInterval}ms). Using ${minInterval}ms.`,
      );
      return minInterval;
    }

    if (parsed > maxInterval) {
      this.logger.warn(
        `Health check interval ${parsed}ms is too high (maximum: ${maxInterval}ms). Using ${maxInterval}ms.`,
      );
      return maxInterval;
    }

    return parsed;
  }
}
