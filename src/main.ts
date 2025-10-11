import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  console.log('🚀 Starting Gym Backend Application...');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV || 'development');
  
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
        // Allow localhost for development and testing
        'http://localhost:3000',
        'http://localhost:3002', 
        /^http:\/\/localhost:\d+$/,
        // Add your production domains when you deploy frontend/admin
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean);

  console.log('🌐 CORS enabled for origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Serve static files (uploaded videos and thumbnails)
  // Note: On free tier, files are stored in ephemeral storage and may be lost on restart
  const uploadsPath = isDevelopment 
    ? join(__dirname, '..', '..', 'uploads')
    : join('/tmp', 'uploads');
    
  console.log('📁 Static files will be served from:', uploadsPath);
  
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
  console.log('🔧 Global prefix set to: /api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Application is running on port: ${port}`);
  console.log(`🌐 API endpoint: http://localhost:${port}/api`);
  console.log(`📁 File uploads: ${isDevelopment ? 'Local ./uploads' : 'Render /tmp'}`);
}
bootstrap();
