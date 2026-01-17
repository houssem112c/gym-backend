import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersPublicController {
    constructor(private readonly usersService: UsersService) { }

    @Get('search')
    async search(@Request() req, @Query('q') query: string) {
        return this.usersService.searchUsers(query, req.user.id);
    }

    @Get('profile/:id')
    async getProfile(@Param('id') id: string) {
        return this.usersService.getUserProfile(id);
    }
}
