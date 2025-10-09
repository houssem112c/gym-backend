import { Module } from '@nestjs/common';
import { BmiController } from './bmi.controller';
import { AdminBmiController } from './admin-bmi.controller';
import { BmiService } from './bmi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BmiController, AdminBmiController],
  providers: [BmiService],
  exports: [BmiService],
})
export class BmiModule {}