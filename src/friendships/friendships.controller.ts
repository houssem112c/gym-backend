import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
    constructor(private readonly friendshipsService: FriendshipsService) { }

    @Post('request/:userId')
    async sendRequest(@Request() req, @Param('userId') userId: string) {
        return this.friendshipsService.sendFriendRequest(req.user.id, userId);
    }

    @Post('accept/:requestId')
    async acceptRequest(@Request() req, @Param('requestId') requestId: string) {
        return this.friendshipsService.acceptFriendRequest(req.user.id, requestId);
    }

    @Post('decline/:requestId')
    async declineRequest(@Request() req, @Param('requestId') requestId: string) {
        return this.friendshipsService.declineFriendRequest(req.user.id, requestId);
    }

    @Get('pending')
    async getPendingRequests(@Request() req) {
        return this.friendshipsService.getPendingRequests(req.user.id);
    }

    @Get('friends')
    async getFriends(@Request() req) {
        return this.friendshipsService.getFriends(req.user.id);
    }

    @Get('status/:userId')
    async getStatus(@Request() req, @Param('userId') userId: string) {
        return this.friendshipsService.getFriendshipStatus(req.user.id, userId);
    }
}
