import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static isConnected = false;
  private static isHealthy = false;
  private static retryCount = 0;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + "?connection_limit=1&pool_timeout=20&connect_timeout=10"
        }
      },
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Connects to the database with retry logic
   */
  private async connectWithRetry(): Promise<void> {
    try {
      if (!PrismaService.isConnected) {
        await this.$connect();
        this.logger.log('Prisma connected');
        PrismaService.isConnected = true;
        PrismaService.isHealthy = true;
        PrismaService.retryCount = 0;
      }
    } catch (error) {
      this.logger.error(`Prisma connection failed (attempt ${PrismaService.retryCount + 1}): ${error.message}`);
      
      if (PrismaService.retryCount < PrismaService.MAX_RETRIES) {
        PrismaService.retryCount++;
        this.logger.log(`Retrying connection in ${PrismaService.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, PrismaService.RETRY_DELAY));
        return this.connectWithRetry();
      }
      
      PrismaService.isHealthy = false;
      if (process.env.NODE_ENV === 'production') {
        throw error; // Fail fast in production
      }
      // In development, continue without DB to allow app startup
    }
  }

  /**
   * Checks if the database connection is healthy
   */
  async isConnectionHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      PrismaService.isHealthy = true;
      return true;
    } catch (error) {
      this.logger.warn(`Database health check failed: ${error.message}`);
      PrismaService.isHealthy = false;
      return false;
    }
  }

  /**
   * Attempts to reconnect if connection is unhealthy
   */
  async reconnectIfNeeded(): Promise<boolean> {
    if (PrismaService.isHealthy) {
      return true;
    }

    try {
      await this.$disconnect();
      PrismaService.isConnected = false;
      await this.connectWithRetry();
      return PrismaService.isHealthy;
    } catch (error) {
      this.logger.error(`Reconnection failed: ${error.message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma disconnected');
      PrismaService.isConnected = false;
    } catch (error) {
      this.logger.error(`Prisma disconnect failed: ${error.message}`);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });

    process.on('SIGINT', async () => {
      await this.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.$disconnect();
      process.exit(0);
    });
  }
} 