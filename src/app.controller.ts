import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Hello from Render!';
  }

  @Get('health/db')
  async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Database connection is working properly'
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Database connection failed'
      };
    }
  }
}
