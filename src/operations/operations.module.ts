import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { PublicOperationsController } from './public-operations.controller';
import { OperationsService } from './operations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsController, PublicOperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
