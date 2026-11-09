import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OperationsService } from './operations.service';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Post('check-in')
  checkIn(@Req() req: any, @Body() body: { scheduleId?: string; method?: string }) {
    return this.operations.checkIn(req.user.id, body.scheduleId, body.method);
  }

  @Post('check-in/gym-qr')
  scanGymQr(
    @Req() req: any,
    @Body() body: { code: string; scheduleId?: string },
  ) {
    return this.operations.checkInFromGymQr(req.user.id, body.code, body.scheduleId);
  }

  @Post('check-out')
  checkOut(@Req() req: any) {
    return this.operations.checkOut(req.user.id);
  }

  @Post('waitlist/:scheduleId')
  joinWaitlist(@Req() req: any, @Param('scheduleId') scheduleId: string) {
    return this.operations.joinWaitlist(req.user.id, scheduleId);
  }

  @Post('bookings/:bookingId/cancel')
  cancelBooking(@Req() req: any, @Param('bookingId') bookingId: string, @Body() body: { reason?: string }) {
    return this.operations.cancelBooking(req.user.id, bookingId, body.reason);
  }

  @Get('attendance')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COACH)
  listAttendance(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 25,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.operations.listAttendance(page, limit, from, to);
  }

  @Patch('members/:userId/suspension')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  suspendMember(@Param('userId') userId: string, @Body('isActive') isActive: boolean, @Req() req: any) {
    return this.operations.suspendMember(userId, isActive).then((result) =>
      this.operations.createAuditLog(req.user.id, isActive ? 'MEMBER_ACTIVATED' : 'MEMBER_SUSPENDED', 'User', userId).then(() => result),
    );
  }

  @Patch('bookings/:bookingId/no-show')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COACH)
  markNoShow(@Param('bookingId') bookingId: string) {
    return this.operations.markNoShow(bookingId);
  }

  @Get('audit-logs')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listAuditLogs(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 25,
  ) {
    return this.operations.listAuditLogs(page, limit);
  }

  @Get('dashboard-metrics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COACH)
  getDashboardMetrics() {
    return this.operations.getDashboardMetrics();
  }

  @Post('staff-invitations')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  inviteStaff(@Body() body: { email: string; role?: 'ADMIN' | 'COACH' }) {
    return this.operations.inviteStaff(body.email, body.role || 'COACH');
  }

}
