import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check(@Res({ passthrough: true }) response?: Response) {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      response?.status(HttpStatus.OK);
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
      };
    } catch (error) {
      response?.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
