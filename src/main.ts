import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  // Create app first to get ConfigService
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Will be adjusted after getting ConfigService
  });

  // Get ConfigService from app context
  const configService = app.get(ConfigService);

  // Get NODE_ENV from ConfigService (with fallback for backward compatibility)
  const NODE_ENV =
    configService.get<string>('NODE_ENV') ||
    process.env.NODE_ENV ||
    'development';
  const isProduction = NODE_ENV === 'production';
  const logger = new Logger('Bootstrap');

  // Log warning if using process.env fallback
  if (!configService.get<string>('NODE_ENV') && process.env.NODE_ENV) {
    logger.warn(
      '⚠️  Using process.env.NODE_ENV fallback. Consider setting it in ConfigModule.',
    );
  }

  logger.log(`Starting application in ${NODE_ENV.toUpperCase()} mode...`);

  // Configure allowed origins based on environment
  const allowedOrigins = isProduction
    ? [
        'https://crm-frontend-14zu7mefp-nmeinertias-projects.vercel.app',
        'https://crm-frontend-eight-gamma.vercel.app',
      ]
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://crm-frontend-14zu7mefp-nmeinertias-projects.vercel.app',
        'https://crm-frontend-eight-gamma.vercel.app',
      ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Socket-Id',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger setup (disabled in production)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('CRM API')
      .setDescription('API documentation for CRM backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } else {
    logger.log('Swagger disabled in production');
  }

  // Get PORT from ConfigService (with fallback for backward compatibility)
  const PORT =
    configService.get<number>('PORT') ||
    parseInt(process.env.PORT || '3000', 10);

  // Log warning if using process.env fallback
  if (!configService.get<number>('PORT') && process.env.PORT) {
    logger.warn(
      '⚠️  Using process.env.PORT fallback. Consider setting it in ConfigModule.',
    );
  }

  await app.listen(PORT);

  logger.log(
    'Swagger Documentation for API is available at: http://localhost:3000/api/docs',
  );
  logger.log(`Server listening on http://localhost:${PORT}`);
  logger.log(`Environment: ${NODE_ENV.toUpperCase()}`);
}
bootstrap();
