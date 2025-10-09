import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto, AdminResponseDto, UpdateContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Public endpoint for anonymous users
  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  // Authenticated user endpoints
  @Post('user')
  @UseGuards(JwtAuthGuard)
  createUserMessage(@Body() createContactDto: CreateContactDto, @Req() req) {
    console.log('=== Contact User Message Request RECEIVED ===');
    console.log('Request body:', createContactDto);
    console.log('User from JWT:', req.user);
    
    const user = req.user;
    
    // Validate that we have the required user information
    if (!user || !user.id || !user.email || !user.name) {
      console.error('Missing user information:', user);
      throw new UnauthorizedException('User authentication failed - missing user data');
    }
    
    // Handle legacy MEDIUM priority value from the request body
    const requestBody = req.body as any;
    let priority = createContactDto.priority;
    if (requestBody.priority === 'MEDIUM') {
      priority = 'NORMAL';
    }
    
    const messageData = {
      ...createContactDto,
      priority,
      name: user.name,        // Get from authenticated user
      email: user.email,      // Get from authenticated user
      userId: user.id,
    };
    
    console.log('Message data to be saved:', messageData);
    
    return this.contactsService.createUserMessage(messageData);
  }

  @Get('user/messages')
  @UseGuards(JwtAuthGuard)
  getUserMessages(@Req() req) {
    const userId = req.user.id;
    return this.contactsService.findUserMessages(userId);
  }

  // Admin endpoints (protected)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('unread') unread?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Req() req?,
  ) {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    
    return this.contactsService.findAll({
      unread: unread === 'true',
      status,
      priority,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    return this.contactsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.contactsService.markAsRead(id);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  respondToMessage(@Param('id') id: string, @Body() responseDto: AdminResponseDto, @Req() req) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.contactsService.respondToMessage(id, responseDto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateDto: UpdateContactDto, @Req() req) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.contactsService.updateContact(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }
    return this.contactsService.remove(id);
  }
}
