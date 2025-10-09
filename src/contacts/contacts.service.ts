import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, AdminResponseDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  // Anonymous contact creation (public)
  async create(createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        name: createContactDto.name,
        email: createContactDto.email,
        phone: createContactDto.phone,
        subject: createContactDto.subject,
        message: createContactDto.message,
        status: 'OPEN',
        priority: 'NORMAL',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Authenticated user message creation
  async createUserMessage(createContactDto: CreateContactDto & { userId: string }) {
    // Map MEDIUM to NORMAL for Prisma compatibility - check as any to handle legacy values
    let priority = createContactDto.priority || 'NORMAL';
    if ((createContactDto as any).priority === 'MEDIUM') {
      priority = 'NORMAL';
    }

    return this.prisma.contact.create({
      data: {
        userId: createContactDto.userId,
        name: createContactDto.name,
        email: createContactDto.email,
        phone: createContactDto.phone,
        subject: createContactDto.subject,
        message: createContactDto.message,
        status: 'OPEN',
        priority: priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Get user's own messages
  async findUserMessages(userId: string) {
    return this.prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Admin: Get all messages with filters
  async findAll(filters?: {
    unread?: boolean;
    status?: string;
    priority?: string;
  }) {
    const where: any = {};

    if (filters?.unread) {
      where.isRead = false;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Get single contact (with access control)
  async findOne(id: string, userId?: string, userRole?: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    // Users can only view their own messages, admins can view all
    if (userRole !== 'ADMIN' && contact.userId !== userId) {
      throw new ForbiddenException('You can only view your own messages');
    }

    return contact;
  }

  // Admin: Mark message as read
  async markAsRead(id: string) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: { 
          isRead: true,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  // Admin: Respond to message
  async respondToMessage(id: string, responseDto: AdminResponseDto, adminId: string) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: {
          adminResponse: responseDto.adminResponse,
          respondedAt: new Date(),
          respondedBy: adminId,
          status: responseDto.status || 'RESPONDED',
          priority: responseDto.priority,
          isRead: true,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  // Admin: Update contact status/priority
  async updateContact(id: string, updateDto: UpdateContactDto) {
    try {
      return await this.prisma.contact.update({
        where: { id },
        data: {
          ...updateDto,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }

  // Admin: Delete message
  async remove(id: string) {
    try {
      return await this.prisma.contact.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
  }
}
