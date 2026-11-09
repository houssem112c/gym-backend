import { Controller, Get, Param } from '@nestjs/common';
import { OperationsService } from './operations.service';

@Controller('operations')
export class PublicOperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('staff-invitations/:token')
  validateStaffInvitation(@Param('token') token: string) {
    return this.operations.validateStaffInvitation(token);
  }
}
