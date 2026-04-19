import {
    BadRequestException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AvatarProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CommitProviderAvatarDto } from './dto/commit-provider-avatar.dto';
import { MirrorProviderModelDto } from './dto/mirror-provider-model.dto';

const DEFAULT_ALLOWED_HOSTS = [
  'readyplayer.me',
  'models.readyplayer.me',
  'api.readyplayer.me',
  // Avaturn public demo + editor + assets/CDN
  'avaturn.dev',
  'avaturn.me',
  'assets.avaturn.me',
];

@Injectable()
export class AvatarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private getAllowedHosts(): string[] {
    const raw = this.configService.get<string>('AVATAR_ALLOWED_HOSTS');
    if (!raw) return DEFAULT_ALLOWED_HOSTS;

    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private isHostAllowed(hostname: string): boolean {
    const allowed = this.getAllowedHosts();
    return allowed.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  }

  private assertAllowedHttpsUrl(urlString: string, fieldName: string) {
    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid URL`);
    }

    if (url.protocol !== 'https:') {
      throw new BadRequestException(`${fieldName} must use https`);
    }

    if (!this.isHostAllowed(url.hostname)) {
      throw new BadRequestException(`${fieldName} host is not allowed`);
    }
  }

  private deriveReadyPlayerMePreviewUrl(avatarId: string): string {
    return `https://models.readyplayer.me/${encodeURIComponent(avatarId)}.png`;
  }

  private deriveReadyPlayerMeModelUrl(avatarId: string): string {
    return `https://models.readyplayer.me/${encodeURIComponent(avatarId)}.glb`;
  }

  async commitProviderAvatar(userId: string, dto: CommitProviderAvatarDto) {
    if (
      dto.provider !== AvatarProvider.READY_PLAYER_ME &&
      dto.provider !== AvatarProvider.AVATURN &&
      dto.provider !== AvatarProvider.INTERNAL
    ) {
      throw new BadRequestException('Unsupported avatar provider');
    }

    const providerPreviewUrl =
      dto.provider === AvatarProvider.READY_PLAYER_ME
        ? dto.providerPreviewUrl ?? this.deriveReadyPlayerMePreviewUrl(dto.providerAvatarId)
        : dto.providerPreviewUrl;

    const providerModelUrl =
      dto.provider === AvatarProvider.READY_PLAYER_ME
        ? dto.providerModelUrl ?? this.deriveReadyPlayerMeModelUrl(dto.providerAvatarId)
        : dto.providerModelUrl;

    // INTERNAL avatars are fully app-managed; we store config JSON but don't require a hosted model URL.
    if (dto.provider !== AvatarProvider.INTERNAL) {
      if (!providerModelUrl) {
        throw new BadRequestException('providerModelUrl is required');
      }

      if (providerPreviewUrl) {
        this.assertAllowedHttpsUrl(providerPreviewUrl, 'providerPreviewUrl');
      }
      this.assertAllowedHttpsUrl(providerModelUrl, 'providerModelUrl');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const avatar = await tx.userAvatar.upsert({
        where: { userId },
        create: {
          userId,
          provider: dto.provider,
          providerAvatarId: dto.providerAvatarId,
          providerPreviewUrl: providerPreviewUrl ?? null,
          providerModelUrl: dto.provider === AvatarProvider.INTERNAL ? null : providerModelUrl,
          config: dto.config as any,
        },
        update: {
          provider: dto.provider,
          providerAvatarId: dto.providerAvatarId,
          providerPreviewUrl: providerPreviewUrl ?? null,
          providerModelUrl: dto.provider === AvatarProvider.INTERNAL ? null : providerModelUrl,
          config: dto.config as any,
        },
      });

      // Keep existing UI working: store the preview image URL in User.avatar when available.
      const user = providerPreviewUrl
        ? await tx.user.update({
            where: { id: userId },
            data: { avatar: providerPreviewUrl },
            select: { id: true, avatar: true },
          })
        : await tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, avatar: true },
          });

      return { avatar, user };
    });

    return {
      provider: result.avatar.provider,
      providerAvatarId: result.avatar.providerAvatarId,
      previewUrl: result.user.avatar,
      mirrored: Boolean(result.avatar.modelBucket && result.avatar.modelPath),
    };
  }

  async mirrorProviderModel(userId: string, dto: MirrorProviderModelDto) {
    const existing = await this.prisma.userAvatar.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Avatar not found');
    }

    if (existing.provider === AvatarProvider.INTERNAL) {
      throw new BadRequestException('Internal avatars have no provider model to mirror');
    }

    const providerModelUrl = dto.providerModelUrl ?? existing.providerModelUrl;
    if (!providerModelUrl) {
      throw new BadRequestException('providerModelUrl is required');
    }

    this.assertAllowedHttpsUrl(providerModelUrl, 'providerModelUrl');

    const maxBytes = Number(this.configService.get<string>('AVATAR_MODEL_MAX_BYTES') ?? 25 * 1024 * 1024);
    const timeoutMs = Number(this.configService.get<string>('AVATAR_MODEL_FETCH_TIMEOUT_MS') ?? 30000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (typeof fetch !== 'function') {
        throw new ServiceUnavailableException('Avatar mirroring requires Node.js 18+');
      }

      const res = await fetch(providerModelUrl, {
        signal: controller.signal,
        redirect: 'error',
      });

      if (!res.ok) {
        throw new BadRequestException('Failed to fetch provider model');
      }

      const contentLengthHeader = res.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = Number(contentLengthHeader);
        if (Number.isFinite(contentLength) && contentLength > maxBytes) {
          throw new BadRequestException('Provider model is too large');
        }
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxBytes) {
        throw new BadRequestException('Provider model is too large');
      }

      const bucket = this.configService.get<string>('AVATAR_MODEL_BUCKET') ?? 'gym-avatars-3d';
      const path = `users/${userId}/avatar.glb`;

      await this.supabaseService.uploadFileToPath({
        bucket,
        path,
        fileBuffer: buffer,
        contentType: 'model/gltf-binary',
        upsert: true,
      });

      const updated = await this.prisma.userAvatar.update({
        where: { userId },
        data: {
          providerModelUrl,
          modelBucket: bucket,
          modelPath: path,
        },
      });

      return {
        provider: updated.provider,
        providerAvatarId: updated.providerAvatarId,
        modelBucket: updated.modelBucket,
        modelPath: updated.modelPath,
        mirrored: true,
      };
    } catch (e: any) {
      if (e && typeof e === 'object' && e.name === 'AbortError') {
        throw new BadRequestException('Provider model fetch timed out');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getMyAvatar(userId: string) {
    const avatar = await this.prisma.userAvatar.findUnique({
      where: { userId },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    let modelUrl: string | null = avatar.providerModelUrl ?? null;

    if (avatar.modelBucket && avatar.modelPath) {
      const expiresIn = Number(this.configService.get<string>('AVATAR_SIGNED_URL_EXPIRES_SECONDS') ?? 600);
      modelUrl = await this.supabaseService.createSignedDownloadUrl(
        avatar.modelBucket,
        avatar.modelPath,
        expiresIn,
      );
    }

    return {
      provider: avatar.provider,
      providerAvatarId: avatar.providerAvatarId,
      previewUrl: avatar.providerPreviewUrl,
      modelUrl,
      mirrored: Boolean(avatar.modelBucket && avatar.modelPath),
      config: avatar.config,
      updatedAt: avatar.updatedAt,
    };
  }

  async deleteMyAvatar(userId: string) {
    const existing = await this.prisma.userAvatar.findUnique({
      where: { userId },
    });

    if (!existing) {
      // Still clear preview URL if it exists
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      });
      return { deleted: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAvatar.delete({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { avatar: null } });
    });

    // Best-effort cleanup of mirrored file
    if (existing.modelBucket && existing.modelPath) {
      await this.supabaseService.deleteObject(existing.modelBucket, existing.modelPath);
    }

    return { deleted: true };
  }
}
