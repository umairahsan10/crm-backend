import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static isConnected = false;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=20&connect_timeout=10"
        }
      },
    });
  }

  async onModuleInit() {
    try {
      if (!PrismaService.isConnected) {
        await this.$connect();
        this.logger.log('Prisma connected');
        PrismaService.isConnected = true;
      }
    } catch (error) {
      this.logger.error(`Prisma connection failed: ${error.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw error; // Fail fast in production
      }
      // In development, continue without DB to allow app startup
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