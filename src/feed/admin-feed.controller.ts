import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/feed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFeedController {
    constructor(private readonly feedService: FeedService) { }

    @Get()
    async findAll() {
        return this.feedService.findAllAdmin();
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.feedService.deletePost(id);
    }
}
