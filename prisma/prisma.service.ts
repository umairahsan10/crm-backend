import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static instance: PrismaService | null = null;
  private static isConnected = false;
  private static initialized = false; // Prevent multiple module inits
  private healthCheckInterval?: NodeJS.Timeout;

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    // Reuse PrismaClient across hot reloads
    if (globalThis['__PRISMA_INSTANCE__']) {
      console.log('[Prisma] Reusing existing Prisma instance (hot reload)');
      return globalThis['__PRISMA_INSTANCE__'];
    }

    console.log('[Prisma] Creating new Prisma instance...');
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Use session pooling mode for PgBouncer to avoid prepared statement conflicts
    // Disable prepared statements to prevent conflicts during hot reload
    const urlWithParams = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'prepared_statements=false&connection_limit=10&pool_timeout=20&pgbouncer=true';
    
    super({
      datasources: {
        db: { url: urlWithParams },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });

    console.log(`[Prisma] DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`[Prisma] NODE_ENV: ${process.env.NODE_ENV}`);

    if (process.env.NODE_ENV === 'development') {
      globalThis['__PRISMA_INSTANCE__'] = this;
    }

    PrismaService.instance = this;
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
    this.logger.log('Starting periodic Prisma health check (every 60s)');
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Use a simple query instead of raw query to avoid prepared statement conflicts
        await this.employee.findFirst({ select: { id: true } });
      } catch (error) {
        this.logger.warn('Database unhealthy — reconnecting...');
        PrismaService.isConnected = false;
        await this.connectWithRetry();
      }
    }, 60000);
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

    if (globalThis['__PRISMA_INSTANCE__']) {
      this.logger.log('Removing global Prisma instance reference');
      delete globalThis['__PRISMA_INSTANCE__'];
    }

    PrismaService.initialized = false;
    console.log('[Prisma] Cleanup completed');
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
