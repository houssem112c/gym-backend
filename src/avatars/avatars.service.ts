import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAvatarConfigDto } from './dto/save-avatar-config.dto';

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAvatarConfig(userId: string, dto: SaveAvatarConfigDto) {
    const data = {
      ...(dto.bodyShape && { bodyShape: dto.bodyShape }),
      ...(dto.skinTone && { skinTone: dto.skinTone }),
      ...(dto.hairStyle && { hairStyle: dto.hairStyle }),
      ...(dto.hairColor && { hairColor: dto.hairColor }),
      ...(dto.faceStyle && { faceStyle: dto.faceStyle }),
      ...(dto.eyeStyle && { eyeStyle: dto.eyeStyle }),
      ...(dto.mouthStyle && { mouthStyle: dto.mouthStyle }),
      ...(dto.outfit && { outfit: dto.outfit }),
      ...(dto.config !== undefined && { config: dto.config }),
    };

    const avatar = await this.prisma.userAvatar.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    return avatar;
  }

  async getMyAvatar(userId: string) {
    const avatar = await this.prisma.userAvatar.findUnique({
      where: { userId },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    return avatar;
  }

  async deleteMyAvatar(userId: string) {
    const existing = await this.prisma.userAvatar.findUnique({
      where: { userId },
    });

    if (!existing) {
      return { deleted: true };
    }

    await this.prisma.userAvatar.delete({ where: { userId } });

    return { deleted: true };
  }
}
