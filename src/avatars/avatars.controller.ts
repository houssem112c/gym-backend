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
import { CommitProviderAvatarDto } from './dto/commit-provider-avatar.dto';
import { MirrorProviderModelDto } from './dto/mirror-provider-model.dto';

@UseGuards(JwtAuthGuard)
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post('me/provider/commit')
  async commitProviderAvatar(@Req() req, @Body() dto: CommitProviderAvatarDto) {
    return this.avatarsService.commitProviderAvatar(req.user.id, dto);
  }

  @Post('me/provider/mirror')
  async mirrorProviderModel(@Req() req, @Body() dto: MirrorProviderModelDto) {
    return this.avatarsService.mirrorProviderModel(req.user.id, dto);
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
