import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  const logger = new Logger('Bootstrap');

  logger.log(`Starting application in ${NODE_ENV.toUpperCase()} mode...`);

  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'debug', 'verbose'],
  });

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

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  logger.log("Swagger Documentation for API is available at: http://localhost:3000/api/docs");
  logger.log(`Server listening on http://localhost:${PORT}`);
  logger.log(`Environment: ${NODE_ENV.toUpperCase()}`);
}
bootstrap();