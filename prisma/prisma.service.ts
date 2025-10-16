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
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL },
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
        await this.$queryRaw`SELECT 1`;
      } catch {
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
    this.logger.log('Checking Prisma connection...');
    try {
      await this.$queryRaw`SELECT 1`;
      PrismaService.isConnected = true;
      this.logger.log('Prisma connection is healthy');
      return true;
    } catch {
      this.logger.warn('Connection not healthy — attempting reconnect...');
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
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async reconnectIfNeeded(): Promise<boolean> {
    if (PrismaService.isConnected) return true;
    await this.connectWithRetry();
    return PrismaService.isConnected;
  }
}
