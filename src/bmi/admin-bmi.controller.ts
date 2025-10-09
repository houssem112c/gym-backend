import {
    Controller,
    Get,
    Delete,
    Param,
    UseGuards,
    Req,
    HttpStatus,
    HttpCode,
    NotFoundException,
    ForbiddenException
} from '@nestjs/common';
import { BmiService } from '../bmi/bmi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/bmi')
@UseGuards(JwtAuthGuard)
export class AdminBmiController {
  constructor(
    private bmiService: BmiService,
    private prisma: PrismaService,
  ) {}

  // Get all BMI records across all users (admin only)
  @Get()
  async getAllBmiRecords(@Req() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const records = await this.prisma.bmiRecord.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        success: true,
        message: 'BMI records retrieved successfully',
        data: records,
        count: records.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve BMI records',
        error: error.message,
      };
    }
  }

  // Get BMI statistics for admin dashboard
  @Get('stats')
  async getBmiStats(@Req() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const [
        totalRecords,
        totalUsers,
        recordsByStatus,
        recordsByCategory,
        recentRecords
      ] = await Promise.all([
        // Total BMI records
        this.prisma.bmiRecord.count(),
        
        // Unique users with BMI records
        this.prisma.bmiRecord.findMany({
          select: { userId: true },
          distinct: ['userId']
        }).then(records => records.length),
        
        // Records by status
        this.prisma.bmiRecord.groupBy({
          by: ['status'],
          _count: true,
        }),
        
        // Records by category
        this.prisma.bmiRecord.groupBy({
          by: ['category'],
          _count: true,
        }),
        
        // Recent records (last 7 days)
        this.prisma.bmiRecord.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);
      
      return {
        success: true,
        data: {
          totalRecords,
          totalUsers,
          recentRecords,
          statusDistribution: recordsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {}),
          categoryDistribution: recordsByCategory.reduce((acc, item) => {
            acc[item.category] = item._count;
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve BMI statistics',
        error: error.message,
      };
    }
  }

  // Get BMI records for a specific user
  @Get('user/:userId')
  async getUserBmiRecords(@Param('userId') userId: string, @Req() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const records = await this.prisma.bmiRecord.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        success: true,
        message: 'User BMI records retrieved successfully',
        data: records,
        count: records.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve user BMI records',
        error: error.message,
      };
    }
  }

  // Delete BMI record (admin only)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteBmiRecord(@Param('id') id: string, @Req() req) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    try {
      // Check if record exists
      const record = await this.prisma.bmiRecord.findUnique({
        where: { id }
      });

      if (!record) {
        throw new NotFoundException('BMI record not found');
      }

      await this.prisma.bmiRecord.delete({
        where: { id }
      });
      
      return {
        success: true,
        message: 'BMI record deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return {
        success: false,
        message: 'Failed to delete BMI record',
        error: error.message,
      };
    }
  }
}