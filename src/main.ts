import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Only show errors and warnings
  });

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite dev server (your frontend)
      'http://localhost:3000',  // Backend itself
      'https://crm-frontend-14zu7mefp-nmeinertias-projects.vercel.app',  // Your Vercel preview domain
      "https://crm-frontend-eight-gamma.vercel.app",  // Your Vercel domain
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true, // Allow cookies and authorization headers
  });

  // Enable validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for frontend: http://localhost:5173`);
}
bootstrap();