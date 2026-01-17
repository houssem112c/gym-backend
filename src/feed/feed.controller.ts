import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @Get()
    async getFeed() {
        return this.feedService.getFeed();
    }

    @Post()
    async createPost(@Request() req, @Body() body: { content?: string; mediaUrls?: string[] }) {
        return this.feedService.createPost(req.user.id, body.content, body.mediaUrls);
    }

    @Post(':id/like')
    async likePost(@Request() req, @Param('id') id: string) {
        return this.feedService.likePost(req.user.id, id);
    }

    @Delete(':id/like')
    async unlikePost(@Request() req, @Param('id') id: string) {
        return this.feedService.unlikePost(req.user.id, id);
    }

    @Get(':id/comments')
    async getComments(@Param('id') id: string) {
        return this.feedService.getComments(id);
    }

    @Post(':id/comments')
    async addComment(@Request() req, @Param('id') id: string, @Body('content') content: string) {
        return this.feedService.addComment(req.user.id, id, content);
    }
}
