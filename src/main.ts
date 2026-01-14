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
      // Allow Azure Frontend
      'https://urbangyms-h4cye7eygwdub8d3.southafricanorth-01.azurewebsites.net',
      // Allow all Vercel domains for admin panel
      /^https:\/\/.*\.vercel\.app$/,
      // Allow custom domains if set
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean);

  console.log('🌐 CORS enabled for origins:', allowedOrigins);

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  // Configure payload limits for file uploads
  // Note: Render free tier has strict memory limits
  const maxFileSize = '100mb'; // Increased for video uploads
  console.log('📂 Max file upload size set to:', maxFileSize);

  app.use((req, res, next) => {
    // Set longer timeout for video uploads, shorter for others
    const isVideoUpload = req.url.includes('/courses') && req.method === 'POST';
    const timeout = isVideoUpload ? 300000 : 30000; // 5min for video uploads, 30s for others

    res.setTimeout(timeout, () => {
      console.log(`⏰ Request timeout reached (${timeout / 1000}s) for ${req.method} ${req.url}`);
      res.status(408).send('Request Timeout - Upload too large or slow');
    });
    next();
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

  // Add request logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] ${req.method} ${req.url}`);

    // Log request body size for POST requests
    if (req.method === 'POST' && req.headers['content-length']) {
      const sizeInBytes = parseInt(req.headers['content-length']);
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
      console.log(`📦 Request body size: ${sizeInBytes} bytes (${sizeInMB} MB)`);
    }

    // Log multipart form data
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log('📎 Multipart form data detected');
    }

    next();
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
