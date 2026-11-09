import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(userId: string, scheduleId?: string, method = 'QR') {
    if (scheduleId) {
      const schedule = await this.prisma.courseSchedule.findUnique({
        where: { id: scheduleId },
        include: { course: true },
      });
      if (!schedule) throw new NotFoundException('Schedule not found');
    }

    const active = await this.prisma.attendance.findFirst({
      where: { userId, checkedOutAt: null },
    });
    if (active) throw new ConflictException('Member is already checked in');

    return this.prisma.attendance.create({
      data: { userId, scheduleId, method },
      include: { schedule: { include: { course: true } } },
    });
  }

  async checkInFromGymQr(userId: string, code: string, scheduleId?: string) {
    if (code.trim() !== 'GYM-CHECKIN') {
      throw new NotFoundException('Invalid gym check-in QR code');
    }
    const member = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!member || member.role !== 'USER') {
      throw new ConflictException('Only members can check in with this QR code');
    }
    if (!member.isActive) throw new ConflictException('Member account is suspended');
    const attendance = await this.checkIn(userId, scheduleId, 'GYM_QR');
    return { ...attendance, member };
  }

  async checkOut(userId: string) {
    const active = await this.prisma.attendance.findFirst({
      where: { userId, checkedOutAt: null },
      orderBy: { checkedInAt: 'desc' },
    });
    if (!active) throw new NotFoundException('No active check-in found');

    return this.prisma.attendance.update({
      where: { id: active.id },
      data: { checkedOutAt: new Date() },
    });
  }

  async listAttendance(page = 1, limit = 25, from?: string, to?: string) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const checkedInAt: { gte?: Date; lte?: Date } = {};
    if (from) checkedInAt.gte = new Date(from);
    if (to) checkedInAt.lte = new Date(to);
    const where = Object.keys(checkedInAt).length ? { checkedInAt } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { checkedInAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          schedule: { include: { course: { select: { id: true, title: true } } } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, total, page: Math.max(page, 1), limit: take };
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.courseBooking.findFirst({
      where: { id: bookingId, userId, status: 'CONFIRMED' },
    });
    if (!booking) throw new NotFoundException('Active booking not found');

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.courseBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });
      const next = await tx.courseWaitlist.findFirst({
        where: { scheduleId: booking.scheduleId, status: 'WAITING' },
        orderBy: { position: 'asc' },
      });
      if (next) {
        await tx.courseBooking.create({
          data: { userId: next.userId, scheduleId: booking.scheduleId },
        });
        await tx.courseWaitlist.update({
          where: { id: next.id },
          data: { status: 'PROMOTED' },
        });
      }
      return cancelled;
    });
  }

  async joinWaitlist(userId: string, scheduleId: string) {
    const schedule = await this.prisma.courseSchedule.findUnique({
      where: { id: scheduleId },
      include: { course: true, _count: { select: { bookings: true } } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.course.capacity <= 0 || schedule._count.bookings < schedule.course.capacity) {
      throw new ConflictException('This class still has available capacity');
    }

    const existing = await this.prisma.courseWaitlist.findUnique({
      where: { userId_scheduleId: { userId, scheduleId } },
    });
    if (existing && existing.status === 'WAITING') {
      throw new ConflictException('Already on the waitlist');
    }

    const last = await this.prisma.courseWaitlist.findFirst({
      where: { scheduleId, status: 'WAITING' },
      orderBy: { position: 'desc' },
    });

    return this.prisma.courseWaitlist.upsert({
      where: { userId_scheduleId: { userId, scheduleId } },
      update: { status: 'WAITING', position: (last?.position || 0) + 1 },
      create: { userId, scheduleId, position: (last?.position || 0) + 1 },
    });
  }

  async suspendMember(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
  }

  async markNoShow(bookingId: string) {
    const booking = await this.prisma.courseBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.courseBooking.update({
      where: { id: bookingId },
      data: { noShow: true },
    });
  }

  async createAuditLog(actorId: string | undefined, action: string, entity: string, entityId?: string, metadata?: object) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entity, entityId, metadata },
    });
  }

  async listAuditLogs(page = 1, limit = 25) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page: Math.max(page, 1), limit: take };
  }

  async getDashboardMetrics() {
    const [activeMembers, revenue, attendance, classes, pendingOrders] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { isActive: true, role: 'USER' } }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { paymentStatus: 'PAID' },
        }),
        this.prisma.attendance.count(),
        this.prisma.course.count({ where: { isActive: true } }),
        this.prisma.order.count({ where: { paymentStatus: 'UNPAID' } }),
      ]);

    return {
      activeMembers,
      revenue: revenue._sum.totalAmount || 0,
      attendance,
      classes,
      pendingOrders,
    };
  }

  async inviteStaff(email: string, role: 'ADMIN' | 'COACH') {
    const token = randomBytes(32).toString('hex');
    await this.prisma.staffInvitation.create({
      data: {
        email: email.toLowerCase().trim(),
        role,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });
    return {
      message: 'Invitation created. Deliver the token through your configured email provider.',
      ...(process.env.NODE_ENV !== 'production' ? { token } : {}),
    };
  }

  async validateStaffInvitation(token: string) {
    const invitation = await this.prisma.staffInvitation.findUnique({
      where: { tokenHash: createHash('sha256').update(token).digest('hex') },
    });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
      throw new NotFoundException('Invitation is invalid or expired');
    }
    return { email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt };
  }
}
