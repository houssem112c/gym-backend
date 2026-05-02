import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvatarsService } from './avatars.service';
import { SaveAvatarConfigDto } from './dto/save-avatar-config.dto';

@UseGuards(JwtAuthGuard)
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post('me/config')
  async saveAvatarConfig(@Req() req, @Body() dto: SaveAvatarConfigDto) {
    return this.avatarsService.saveAvatarConfig(req.user.id, dto);
  }

  @Get('me')
  async getMyAvatar(@Req() req) {
    return this.avatarsService.getMyAvatar(req.user.id);
  }

  @Delete('me')
  async deleteMyAvatar(@Req() req) {
    return this.avatarsService.deleteMyAvatar(req.user.id);
  }
}
