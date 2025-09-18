import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private static isConnected = false;

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

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
} 