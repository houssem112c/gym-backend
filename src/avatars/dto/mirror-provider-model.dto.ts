import { IsOptional, IsUrl, MaxLength } from 'class-validator';

export class MirrorProviderModelDto {
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2000)
  providerModelUrl?: string;
}
