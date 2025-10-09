import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBmiRecordDto, Gender } from './dto/create-bmi-record.dto';

export enum BmiStatus {
  OK = 'OK',
  CAUTION = 'CAUTION',
  NOT_OK = 'NOT_OK'
}

interface BmiCalculationResult {
  bmiValue: number;
  category: string;
  status: BmiStatus;
  recommendations?: string;
}

interface BmiCategoryRule {
  min: number;
  max: number;
  category: string;
  status: BmiStatus;
}

@Injectable()
export class BmiService {
  constructor(private prisma: PrismaService) {}

  calculateBmi(weight: number, height: number): number {
    // BMI = weight (kg) / height (m)²
    return Number((weight / (height * height)).toFixed(2));
  }

  determineBmiCategory(bmiValue: number, age: number, gender: Gender): BmiCalculationResult {
    let category: string;
    let status: BmiStatus;
    let recommendations: string = '';

    if (age >= 2 && age <= 17) {
      // Children & Teenagers (2-17 years) - Use percentiles (simplified ranges)
      const result = this.getChildBmiCategory(bmiValue, age, gender);
      category = result.category;
      status = result.status;
      recommendations = result.recommendations;
    } else if (age >= 18 && age <= 64) {
      // Adults (18-64 years)
      const result = this.getAdultBmiCategory(bmiValue);
      category = result.category;
      status = result.status;
      recommendations = result.recommendations;
    } else if (age >= 65) {
      // Elderly (65+ years)
      const result = this.getElderlyBmiCategory(bmiValue);
      category = result.category;
      status = result.status;
      recommendations = result.recommendations;
    } else {
      // Invalid age
      category = 'Invalid Age';
      status = BmiStatus.NOT_OK;
      recommendations = 'Age must be 2 years or older for BMI calculation.';
    }

    return {
      bmiValue,
      category,
      status,
      recommendations
    };
  }

  private getAdultBmiCategory(bmiValue: number): { category: string; status: BmiStatus; recommendations: string } {
    if (bmiValue < 18.5) {
      return {
        category: 'Underweight',
        status: BmiStatus.NOT_OK,
        recommendations: 'Consider consulting a healthcare provider. Focus on healthy weight gain through balanced nutrition and strength training.'
      };
    } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
      return {
        category: 'Normal',
        status: BmiStatus.OK,
        recommendations: 'Great job! Maintain your current lifestyle with regular exercise and balanced nutrition.'
      };
    } else if (bmiValue >= 25 && bmiValue <= 29.9) {
      return {
        category: 'Overweight',
        status: BmiStatus.CAUTION,
        recommendations: 'Consider increasing physical activity and reviewing your diet. Small changes can make a big difference.'
      };
    } else if (bmiValue >= 30 && bmiValue <= 34.9) {
      return {
        category: 'Obesity Class I',
        status: BmiStatus.NOT_OK,
        recommendations: 'Consult with a healthcare provider for a personalized weight management plan. Focus on gradual lifestyle changes.'
      };
    } else if (bmiValue >= 35 && bmiValue <= 39.9) {
      return {
        category: 'Obesity Class II',
        status: BmiStatus.NOT_OK,
        recommendations: 'Medical supervision recommended. Consider comprehensive weight management program with professional guidance.'
      };
    } else {
      return {
        category: 'Obesity Class III',
        status: BmiStatus.NOT_OK,
        recommendations: 'Immediate medical attention recommended. Consult with healthcare professionals for comprehensive treatment options.'
      };
    }
  }

  private getElderlyBmiCategory(bmiValue: number): { category: string; status: BmiStatus; recommendations: string } {
    if (bmiValue < 18.5) {
      return {
        category: 'Underweight',
        status: BmiStatus.NOT_OK,
        recommendations: 'Consult with a healthcare provider. Adequate nutrition is especially important for seniors.'
      };
    } else if (bmiValue >= 18.5 && bmiValue <= 22.9) {
      return {
        category: 'Slightly Low',
        status: BmiStatus.CAUTION,
        recommendations: 'Monitor weight regularly. Consider increasing protein intake and gentle strength exercises.'
      };
    } else if (bmiValue >= 23 && bmiValue <= 29.9) {
      return {
        category: 'Normal/Slightly High',
        status: BmiStatus.OK,
        recommendations: 'Excellent! Continue with regular gentle exercise and balanced nutrition appropriate for your age.'
      };
    } else {
      return {
        category: 'Obese',
        status: BmiStatus.NOT_OK,
        recommendations: 'Consult with healthcare provider. Focus on gentle, age-appropriate exercise and nutrition modifications.'
      };
    }
  }

  private getChildBmiCategory(bmiValue: number, age: number, gender: Gender): { category: string; status: BmiStatus; recommendations: string } {
    // Simplified BMI ranges for children (in real implementation, you'd use CDC/WHO percentile charts)
    // These are approximate ranges based on typical percentile distributions
    
    let underweightThreshold: number;
    let overweightThreshold: number;
    let obeseThreshold: number;

    if (age >= 2 && age <= 5) {
      // Preschool children
      underweightThreshold = 14.0;
      overweightThreshold = 17.5;
      obeseThreshold = 19.0;
    } else if (age >= 6 && age <= 11) {
      // School age children
      underweightThreshold = 15.0;
      overweightThreshold = gender === Gender.MALE ? 20.0 : 19.5;
      obeseThreshold = gender === Gender.MALE ? 23.0 : 22.5;
    } else {
      // Teenagers (12-17)
      underweightThreshold = gender === Gender.MALE ? 17.0 : 16.5;
      overweightThreshold = gender === Gender.MALE ? 24.0 : 23.5;
      obeseThreshold = gender === Gender.MALE ? 28.0 : 27.0;
    }

    if (bmiValue < underweightThreshold) {
      return {
        category: 'Underweight',
        status: BmiStatus.NOT_OK,
        recommendations: 'Consult with a pediatrician. Ensure adequate nutrition for healthy growth and development.'
      };
    } else if (bmiValue >= underweightThreshold && bmiValue < overweightThreshold) {
      return {
        category: 'Healthy Weight',
        status: BmiStatus.OK,
        recommendations: 'Great! Maintain healthy eating habits and stay active with age-appropriate activities.'
      };
    } else if (bmiValue >= overweightThreshold && bmiValue < obeseThreshold) {
      return {
        category: 'Overweight',
        status: BmiStatus.CAUTION,
        recommendations: 'Consult with a pediatrician. Focus on healthy family meals and increased physical activity.'
      };
    } else {
      return {
        category: 'Obese',
        status: BmiStatus.NOT_OK,
        recommendations: 'Medical evaluation recommended. Work with healthcare providers on family-based lifestyle changes.'
      };
    }
  }

  async createBmiRecord(userId: string, createBmiRecordDto: CreateBmiRecordDto) {
    const { age, gender, height, weight } = createBmiRecordDto;

    // Calculate BMI
    const bmiResult = this.calculateBmi(weight, height);
    const categoryResult = this.determineBmiCategory(bmiResult, age, gender);

    // Save to database
    const bmiRecord = await this.prisma.bmiRecord.create({
      data: {
        userId,
        age,
        gender,
        height,
        weight,
        bmiValue: categoryResult.bmiValue,
        category: categoryResult.category,
        status: categoryResult.status,
        notes: categoryResult.recommendations,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    return {
      ...bmiRecord,
      recommendations: categoryResult.recommendations,
    };
  }

  async getUserBmiRecords(userId: string) {
    return this.prisma.bmiRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });
  }

  async getBmiRecord(id: string, userId: string) {
    return this.prisma.bmiRecord.findFirst({
      where: { 
        id,
        userId // Ensure user can only access their own records
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });
  }

  async getLatestBmiRecord(userId: string) {
    return this.prisma.bmiRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });
  }

  async deleteBmiRecord(id: string, userId: string) {
    // First check if the record exists and belongs to the user
    const record = await this.prisma.bmiRecord.findFirst({
      where: { id, userId }
    });

    if (!record) {
      throw new Error('BMI record not found or access denied');
    }

    return this.prisma.bmiRecord.delete({
      where: { id }
    });
  }
}