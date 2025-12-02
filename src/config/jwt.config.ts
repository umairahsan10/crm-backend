import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Configuration Interface
 *
 * Defines the structure for JWT configuration including:
 * - Secret key for signing tokens
 * - Token expiration time
 * - Debug mode for development
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
  debug: boolean;
}

/**
 * JWT Configuration Service
 *
 * Provides type-safe, validated JWT configuration from environment variables.
 * Handles:
 * - Environment variable loading and validation
 * - Default value assignment
 * - Environment-specific overrides
 */
@Injectable()
export class JwtConfigService {
  private readonly logger = new Logger(JwtConfigService.name);
  private config: JwtConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Get the complete JWT configuration
   */
  getConfig(): JwtConfig {
    return { ...this.config };
  }

  /**
   * Get the JWT secret key
   */
  getSecret(): string {
    return this.config.secret;
  }

  /**
   * Get the token expiration time
   */
  getExpiresIn(): string {
    return this.config.expiresIn;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.config.debug;
  }

  /**
   * Load and parse configuration from environment variables
   */
  private loadConfig(): JwtConfig {
    const environment = (this.configService.get<string>('NODE_ENV') ||
      'development') as 'development' | 'production' | 'test';
    const isProduction = environment === 'production';

    // Load required environment variables
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      if (isProduction) {
        throw new Error(
          'JWT_SECRET environment variable is required in production',
        );
      }
      // In development, use a default but warn
      this.logger.warn(
        '⚠️  JWT_SECRET not set. Using default secret (NOT SECURE FOR PRODUCTION)',
      );
      this.logger.warn(
        '⚠️  Please set JWT_SECRET in your environment variables',
      );
    }

    // Load optional configuration with defaults
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const debug = this.parseBoolean(
      this.configService.get<string>('JWT_DEBUG'),
      !isProduction, // Debug enabled in development by default
    );

    return {
      secret: secret || 'your-super-secret-jwt-key-for-crm-backend-2024',
      expiresIn,
      debug,
    };
  }

  /**
   * Validate the configuration
   */
  private validateConfig(): void {
    // Validate secret
    if (!this.config.secret || this.config.secret.trim() === '') {
      throw new Error('JWT_SECRET cannot be empty');
    }

    // Validate secret strength in production
    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';
    if (environment === 'production') {
      if (this.config.secret.length < 32) {
        this.logger.warn(
          '⚠️  JWT_SECRET should be at least 32 characters long for production',
        );
      }
      if (
        this.config.secret === 'your-super-secret-jwt-key-for-crm-backend-2024'
      ) {
        throw new Error(
          'JWT_SECRET must be changed from default value in production',
        );
      }
    }

    // Validate expiresIn format (basic check)
    const expiresInRegex = /^\d+[smhd]$/;
    if (!expiresInRegex.test(this.config.expiresIn)) {
      this.logger.warn(
        `⚠️  JWT_EXPIRES_IN format may be invalid: "${this.config.expiresIn}". ` +
          `Expected format: number followed by s/m/h/d (e.g., "7d", "1h", "30m")`,
      );
    }

    this.logger.log('✅ JWT configuration validated successfully');
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
}
