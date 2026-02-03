
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePrivateSessionDto } from './dto/create-private-session.dto';
import { RespondPrivateSessionDto } from './dto/respond-private-session.dto';
import { PrivateSessionStatus, NotificationType } from '@prisma/client';

@Injectable()
export class PrivateSessionsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    // ----------------------------------------------------------------
    // CREATE REQUEST
    // ----------------------------------------------------------------
    async createRequest(userId: string, dto: CreatePrivateSessionDto) {
        const { coachId, date, startTime, endTime, note } = dto;

        // Basic validation: ensure coach exists
        const coach = await this.prisma.user.findUnique({ where: { id: coachId } });
        if (!coach) throw new NotFoundException('Coach not found');

        // Check availability (optional but good practice)
        // For now, we'll allow creation and let coach decide, or we could enforce it.
        // Let's enforce it loosely.

        const session = await this.prisma.privateSession.create({
            data: {
                userId,
                coachId,
                date: new Date(date),
                startTime,
                endTime,
                note,
                status: PrivateSessionStatus.PENDING,
            },
        });

        // Notify Coach
        await this.notificationsService.createNotification({
            userId: coachId,
            actorId: userId,
            type: NotificationType.PRIVATE_SESSION_REQUEST,
            title: 'New Private Session Request',
            message: 'A user has requested a private session.',
            referenceId: session.id
        });

        return session;
    }

    // ----------------------------------------------------------------
    // RESPOND TO REQUEST
    // ----------------------------------------------------------------
    async respondToRequest(sessionId: string, coachId: string, dto: RespondPrivateSessionDto) {
        const session = await this.prisma.privateSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) throw new NotFoundException('Session not found');

        if (session.coachId !== coachId) {
            throw new ForbiddenException('You are not the coach for this session');
        }

        const updatedSession = await this.prisma.privateSession.update({
            where: { id: sessionId },
            data: { status: dto.status },
        });

        // Notify User
        let title = 'Session Update';
        let message = `Your private session request has been ${dto.status.toLowerCase()}.`;
        let type: NotificationType = NotificationType.PRIVATE_SESSION_ACCEPTED;

        if (dto.status === 'ACCEPTED') {
            title = 'Session Accepted!';
            message = 'Your coach has accepted your private session request.';
            type = NotificationType.PRIVATE_SESSION_ACCEPTED;
        } else if (dto.status === 'DECLINED') {
            title = 'Session Declined';
            message = 'Your coach has declined your private session request.';
            type = NotificationType.PRIVATE_SESSION_DECLINED;
        }

        await this.notificationsService.createNotification({
            userId: session.userId,
            actorId: coachId,
            type: type,
            title: title,
            message: message,
            referenceId: session.id
        });

        return updatedSession;
    }

    // ----------------------------------------------------------------
    // GET AVAILABILITY
    // ----------------------------------------------------------------
    async getCoachAvailability(coachId: string, dateStr: string) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getUTCDay(); // 0-6 Use UTC day to avoid timezone shifts

        // 1. Working Hours (09:00 - 20:00) -> Slots: 09:00, 10:00... 19:00
        // We assume 1 hour slots for simplicity
        const possibleSlots = [
            '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
            '15:00', '16:00', '17:00', '18:00', '19:00'
        ];

        // 2. Fetch Existing Private Sessions (Accepted or Pending)
        const privateSessions = await this.prisma.privateSession.findMany({
            where: {
                coachId,
                date: date,
                status: { in: [PrivateSessionStatus.ACCEPTED, PrivateSessionStatus.PENDING] },
            },
        });

        // 3. Fetch Course Schedules
        // Logic: specificDate matches OR (isRecurring AND dayOfWeek matches AND (startDate <= date) AND (endDate >= date OR null))
        const schedules = await this.prisma.courseSchedule.findMany({
            where: {
                course: { instructorId: coachId },
                isActive: true,
                OR: [
                    { specificDate: date },
                    {
                        isRecurring: true,
                        dayOfWeek: dayOfWeek,
                        startDate: { lte: date },
                        OR: [
                            { endDate: null },
                            { endDate: { gte: date } }
                        ]
                    }
                ]
            },
        });

        // Helper to normalize time "9:00" -> "09:00"
        const normalizeTime = (t: string) => t.includes(':') && t.split(':')[0].length === 1 ? `0${t}` : t;

        // 4. Calculate Availability
        const availability = possibleSlots.map(time => {
            // Check Private Sessions overlap
            const isBlockedBySession = privateSessions.some(s => normalizeTime(s.startTime) === time);

            // Check Course Schedules overlap
            const isBlockedByCourse = schedules.some(s => normalizeTime(s.startTime) === time);

            return {
                time,
                isAvailable: !isBlockedBySession && !isBlockedByCourse
            };
        });

        return availability;
    }

    // ----------------------------------------------------------------
    // GET MY SESSIONS (User)
    // ----------------------------------------------------------------
    async getMySessions(userId: string) {
        return this.prisma.privateSession.findMany({
            where: { userId },
            include: {
                coach: { select: { id: true, name: true, avatar: true, email: true } }
            },
            orderBy: { date: 'desc' }
        });
    }

    // ----------------------------------------------------------------
    // GET COACH REQUESTS (Coach)
    // ----------------------------------------------------------------
    async getCoachRequests(coachId: string) {
        return this.prisma.privateSession.findMany({
            where: { coachId },
            include: {
                user: { select: { id: true, name: true, avatar: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
