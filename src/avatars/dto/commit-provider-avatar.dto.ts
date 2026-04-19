import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { AvatarProvider } from '@prisma/client';

export class CommitProviderAvatarDto {
  @IsEnum(AvatarProvider)
  provider: AvatarProvider;

  @IsString()
  @MaxLength(200)
  providerAvatarId: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2000)
  providerPreviewUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2000)
  providerModelUrl?: string;

  // Optional: provider payload (version, metadata). Stored as JSON.
  @IsOptional()
  config?: unknown;
}
