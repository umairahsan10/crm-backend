import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App') // Groups all endpoints in a "App" section in Swagger UI
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint', description: 'Returns a basic hello message.' })
  @ApiResponse({ status: 200, description: 'Successfully returned a greeting.' })
  getHello(): string {
    return 'Hello from Render!';
  }

  @Get('health/db')
  @ApiOperation({
    summary: 'Database health check',
    description: 'Verifies if the database connection is active and responding properly.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database connection healthy',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-10-14T10:00:00.000Z',
        message: 'Database connection is working properly',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Database connection failed',
    schema: {
      example: {
        status: 'unhealthy',
        timestamp: '2025-10-14T10:00:00.000Z',
        error: 'Database connection timeout',
        message: 'Database connection failed',
      },
    },
  })
  async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Database connection is working properly',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Database connection failed',
      };
    }
  }
}
