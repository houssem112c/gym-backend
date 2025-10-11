import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for frontend, admin, and mobile web app
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowedOrigins = isDevelopment 
    ? [
        'http://localhost:3000', 
        'http://localhost:3002', 
        /^http:\/\/localhost:\d+$/  // Allow any localhost port for Flutter web dev server
      ]
    : [
        // Add your production domains here
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Serve static files (uploaded videos and thumbnails)
  const uploadsPath = isDevelopment 
    ? join(__dirname, '..', '..', 'uploads')
    : join('/tmp', 'uploads');
    
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
