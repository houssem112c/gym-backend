import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    HttpStatus,
    HttpCode,
    NotFoundException, BadRequestException
} from '@nestjs/common';
import { BmiService } from './bmi.service';
import { CreateBmiRecordDto } from './dto/create-bmi-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bmi')
@UseGuards(JwtAuthGuard)
export class BmiController {
  constructor(private bmiService: BmiService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBmiRecord(@Body() createBmiRecordDto: CreateBmiRecordDto, @Req() req) {
    try {
      const userId = req.user.id;
      const result = await this.bmiService.createBmiRecord(userId, createBmiRecordDto);
      
      return {
        success: true,
        message: 'BMI record created successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to create BMI record',
        error: error.message,
      });
    }
  }

  @Get()
  async getUserBmiRecords(@Req() req) {
    try {
      const userId = req.user.id;
      const records = await this.bmiService.getUserBmiRecords(userId);
      
      return {
        success: true,
        message: 'BMI records retrieved successfully',
        data: records,
        count: records.length,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve BMI records',
        error: error.message,
      });
    }
  }

  @Get('latest')
  async getLatestBmiRecord(@Req() req) {
    try {
      const userId = req.user.id;
      const record = await this.bmiService.getLatestBmiRecord(userId);
      
      if (!record) {
        return {
          success: true,
          message: 'No BMI records found',
          data: null,
        };
      }
      
      return {
        success: true,
        message: 'Latest BMI record retrieved successfully',
        data: record,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve latest BMI record',
        error: error.message,
      });
    }
  }

  @Get(':id')
  async getBmiRecord(@Param('id') id: string, @Req() req) {
    try {
      const userId = req.user.id;
      const record = await this.bmiService.getBmiRecord(id, userId);
      
      if (!record) {
        throw new NotFoundException({
          success: false,
          message: 'BMI record not found',
        });
      }
      
      return {
        success: true,
        message: 'BMI record retrieved successfully',
        data: record,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to retrieve BMI record',
        error: error.message,
      });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteBmiRecord(@Param('id') id: string, @Req() req) {
    try {
      const userId = req.user.id;
      await this.bmiService.deleteBmiRecord(id, userId);
      
      return {
        success: true,
        message: 'BMI record deleted successfully',
      };
    } catch (error) {
      if (error.message === 'BMI record not found or access denied') {
        throw new NotFoundException({
          success: false,
          message: 'BMI record not found or access denied',
        });
      }
      throw new BadRequestException({
        success: false,
        message: 'Failed to delete BMI record',
        error: error.message,
      });
    }
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculateBmi(@Body() calculateDto: CreateBmiRecordDto) {
    try {
      const bmiValue = this.bmiService.calculateBmi(calculateDto.weight, calculateDto.height);
      const categoryResult = this.bmiService.determineBmiCategory(bmiValue, calculateDto.age, calculateDto.gender);
      
      return {
        success: true,
        message: 'BMI calculated successfully',
        data: {
          bmiValue: categoryResult.bmiValue,
          category: categoryResult.category,
          status: categoryResult.status,
          recommendations: categoryResult.recommendations,
          input: {
            age: calculateDto.age,
            gender: calculateDto.gender,
            height: calculateDto.height,
            weight: calculateDto.weight,
          }
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to calculate BMI',
        error: error.message,
      });
    }
  }
}