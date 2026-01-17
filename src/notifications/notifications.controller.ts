import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getNotifications(@Request() req) {
        return this.notificationsService.getNotifications(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Delete(':id')
    async deleteNotification(@Request() req, @Param('id') id: string) {
        return this.notificationsService.deleteNotification(id, req.user.id);
    }
}
