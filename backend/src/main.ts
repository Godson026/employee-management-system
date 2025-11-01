import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// Make crypto available globally for TypeORM
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
  }));
  
  // Enable CORS for frontend communication
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl 
    ? frontendUrl.split(',').map(url => url.trim())
    : [
        'http://localhost:5173',
        'http://10.246.149.112:5173',
        'http://10.29.93.112:5173',
        'http://127.0.0.1:5173',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) or from whitelisted origins
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
}
bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
