import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  INestApplication,
  Optional,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseConfigService } from '../src/config/database.config';

/**
 * PrismaService
 * 
 * Database service extending PrismaClient with:
 * - Config-driven connection management
 * - PgBouncer connection pooling
 * - Health monitoring
 * - Graceful shutdown handling
 * - Connection retry logic
 * 
 * Uses DatabaseConfigService for type-safe configuration.
 * Falls back to environment variables if config service is not available.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static isConnected = false;
  private static initialized = false; // Prevent multiple module inits
  private healthCheckInterval?: NodeJS.Timeout;

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 5000; // 5 seconds

  constructor(@Optional() @Inject(DatabaseConfigService) private configService?: DatabaseConfigService) {
    // Compute database URL and log level before calling super()
    // (super() must be called before accessing 'this' in derived classes)
    const databaseUrl = configService
      ? configService.getDatabaseUrl()
      : PrismaService.getDatabaseUrlFromEnvStatic();

    const logLevel = PrismaService.getLogLevelStatic(configService);

    super({
      datasources: {
        db: { url: databaseUrl },
      },
      log: logLevel,
    });

    this.logger.log('PrismaService instance created');
    if (this.configService) {
      this.logger.log('✅ Using DatabaseConfigService for configuration');
    } else {
      this.logger.warn('⚠️  DatabaseConfigService not available, falling back to process.env');
      this.logger.warn('⚠️  This is not recommended. Please ensure DatabaseModule is imported in AppModule.');
      this.logger.warn('⚠️  Direct environment variable access bypasses validation and type safety.');
    }
  }

  /**
   * Get database URL from environment (fallback) - static version for constructor
   * 
   * @deprecated This method is a fallback when DatabaseConfigService is not available.
   * It should not be used in normal operation. Ensure DatabaseModule is properly imported.
   */
  private static getDatabaseUrlFromEnvStatic(): string {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please ensure DatabaseModule is imported in AppModule or set DATABASE_URL in your environment.'
      );
    }

    // Build URL with PgBouncer parameters
    // Note: These are hardcoded defaults. Use DatabaseConfigService for configurable values.
    const urlWithParams =
      databaseUrl +
      (databaseUrl.includes('?') ? '&' : '?') +
      'prepared_statements=false&connection_limit=10&pool_timeout=20&pgbouncer=true';
    
    return urlWithParams;
  }

  /**
   * Get database URL from environment (fallback) - instance version with logging
   * 
   * @deprecated This method is a fallback when DatabaseConfigService is not available.
   * It should not be used in normal operation. Ensure DatabaseModule is properly imported.
   */
  private getDatabaseUrlFromEnv(): string {
    this.logger.warn('⚠️  Using process.env.DATABASE_URL fallback (not recommended)');
    
    const url = PrismaService.getDatabaseUrlFromEnvStatic();
    
    this.logger.warn('⚠️  Using hardcoded PgBouncer parameters. Consider using DatabaseConfigService for configuration.');
    
    return url;
  }

  /**
   * Get log level based on environment - static version for constructor
   */
  private static getLogLevelStatic(configService?: DatabaseConfigService): ('warn' | 'error' | 'info' | 'query')[] {
    if (configService) {
      const env = configService.getEnvironment();
      if (env === 'development') {
        return configService.isLoggingEnabled()
          ? ['warn', 'error', 'info']
          : ['warn', 'error'];
      }
      return ['error'];
    }

    // Fallback to environment variable
    return process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'];
  }

  /**
   * Get log level based on environment - instance version
   */
  private getLogLevel(): ('warn' | 'error' | 'info' | 'query')[] {
    if (this.configService) {
      const env = this.configService.getEnvironment();
      if (env === 'development') {
        return this.configService.isLoggingEnabled()
          ? ['warn', 'error', 'info']
          : ['warn', 'error'];
      }
      return ['error'];
    }

    // Fallback to environment variable
    // Log warning only once during construction (not on every call)
    if (process.env.NODE_ENV) {
      this.logger.debug('Using process.env.NODE_ENV for log level configuration (fallback mode)');
    }
    
    return process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'];
  }

  async onModuleInit() {
    if (PrismaService.initialized) {
      this.logger.debug('Trying to initialise prisma connection again — skipping (already initialized)');
      return; // Skip repeated init on multiple module injections
    }

    PrismaService.initialized = true;
    this.logger.log('Initializing Prisma connection...');
    await this.ensureConnected();
    if (process.env.NODE_ENV === 'development') {
      this.startHealthCheck();
    }
  }

  private async connectWithRetry(): Promise<void> {
    let attempts = 0;
    while (attempts < PrismaService.MAX_RETRIES) {
      try {
        this.logger.log(`Connecting to Supabase (attempt ${attempts + 1})...`);
        
        // Force disconnect first to clear any existing prepared statements
        try {
          await this.$disconnect();
          // Small delay to ensure cleanup
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          // Ignore disconnect errors
        }
        
        await this.$connect();
        PrismaService.isConnected = true;
        this.logger.log('Prisma connected successfully (PgBouncer 6543)');
        console.log(`[Prisma] Connection established successfully.`);
        return;
      } catch (err) {
        attempts++;
        this.logger.error(`Attempt ${attempts} failed: ${err.message}`);
        if (attempts < PrismaService.MAX_RETRIES) {
          this.logger.warn(`Retrying in ${PrismaService.RETRY_DELAY / 1000}s...`);
          await new Promise((r) => setTimeout(r, PrismaService.RETRY_DELAY));
        } else {
          this.logger.error('Prisma connection failed after all retries.');
        }
      }
    }
  }

  /** Regular health monitoring (dev only) */
  private startHealthCheck() {
    this.stopHealthCheck(); // Prevent multiple intervals
    
    // Get health check interval from config service or use default
    const interval = this.configService
      ? this.configService.getHealthCheckInterval()
      : 60000; // Default: 60 seconds (fallback if config service not available)
    
    const intervalSeconds = interval / 1000;
    this.logger.log(`Starting periodic Prisma health check (every ${intervalSeconds}s)`);
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Use a simple query instead of raw query to avoid prepared statement conflicts
        await this.employee.findFirst({ select: { id: true } });
      } catch (error) {
        this.logger.warn('Database unhealthy — reconnecting...');
        PrismaService.isConnected = false;
        await this.connectWithRetry();
      }
    }, interval);
    
    // Log warning if using fallback
    if (!this.configService) {
      this.logger.warn(
        `⚠️  Using default health check interval (${intervalSeconds}s). ` +
        `Set DB_HEALTH_CHECK_INTERVAL environment variable or use DatabaseConfigService for configuration.`
      );
    }
  }

  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      this.logger.log('Stopping Prisma health check interval');
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /** Ensures DB is reachable, reconnects if not */
  async ensureConnected(): Promise<boolean> {
    // If already marked as connected, verify with a quick query
    if (PrismaService.isConnected) {
      try {
        // Use a simple query to verify connection is still alive
        await this.employee.findFirst({ select: { id: true } });
        return true;
      } catch (error) {
        // Connection lost, reset flag and reconnect
        this.logger.warn('Connection lost during check — reconnecting...');
        PrismaService.isConnected = false;
      }
    }

    // Not connected or connection lost, establish connection
    this.logger.log('Ensuring Prisma connection...');
    try {
      // Try to connect directly first
      if (!PrismaService.isConnected) {
        await this.connectWithRetry();
      }
      
      // Verify connection with a test query
      await this.employee.findFirst({ select: { id: true } });
      PrismaService.isConnected = true;
      this.logger.log('Prisma connection is healthy');
      return true;
    } catch (error) {
      // If connection fails, try one more time
      this.logger.warn('Connection check failed — attempting reconnect...');
      PrismaService.isConnected = false;
      await this.connectWithRetry();
      return PrismaService.isConnected;
    }
  }

  async onModuleDestroy() {
    this.logger.log('onModuleDestroy() triggered — cleaning up Prisma...');
    this.stopHealthCheck();

    if (PrismaService.isConnected) {
      this.logger.log('Disconnecting Prisma...');
      await this.$disconnect();
      PrismaService.isConnected = false;
      this.logger.log('Prisma disconnected cleanly');
    }

    PrismaService.initialized = false;
    this.logger.log('Prisma cleanup completed');
  }

  async enableShutdownHooks(app: INestApplication) {
    this.logger.log('Enabling graceful shutdown hooks for Prisma');
    app.enableShutdownHooks();

    process.on('beforeExit', async () => {
      this.logger.log('Application exiting — disconnecting Prisma...');
      await this.$disconnect();
    });
  }

  async isConnectionHealthy(): Promise<boolean> {
    try {
      // Use a simple query instead of raw query to avoid prepared statement conflicts
      await this.employee.findFirst({ select: { id: true } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async reconnectIfNeeded(): Promise<boolean> {
    if (PrismaService.isConnected) return true;
    await this.connectWithRetry();
    return PrismaService.isConnected;
  }

  async forceReconnect(): Promise<void> {
    this.logger.log('Force reconnecting Prisma to clear prepared statements...');
    PrismaService.isConnected = false;
    await this.connectWithRetry();
  }

  /**
   * Clear prepared statements by executing a simple query
   * This helps prevent prepared statement conflicts during hot reload
   */
  async clearPreparedStatements(): Promise<void> {
    try {
      // Execute a simple query to clear any prepared statements
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      // Ignore errors as this is just cleanup
      this.logger.debug('Prepared statement cleanup completed');
    }
  }
}
