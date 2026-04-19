import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // Prefer service role key on backend for private buckets + signed URLs
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. File uploads will not work.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    bucket: string,
    folder: string = ''
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase is not configured');
    }

    const timestamp = Date.now();
    const sanitizedFileName = originalName.replaceAll(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = folder ? `${folder}/${timestamp}-${sanitizedFileName}` : `${timestamp}-${sanitizedFileName}`;

    const { error } = await this.supabase.storage.from(bucket).upload(fileName, fileBuffer, {
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async uploadFileToPath(params: {
    bucket: string;
    path: string;
    fileBuffer: Buffer;
    contentType?: string;
    upsert?: boolean;
  }): Promise<{ bucket: string; path: string }> {
    if (!this.supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await this.supabase.storage.from(params.bucket).upload(params.path, params.fileBuffer, {
      upsert: params.upsert ?? false,
      contentType: params.contentType,
    });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return { bucket: params.bucket, path: params.path };
  }

  async createSignedDownloadUrl(
    bucket: string,
    filePath: string,
    expiresInSeconds: number
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
  }

  async deleteObject(bucket: string, filePath: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await this.supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Failed to delete file:', error);
    }
  }

  async deleteFile(fileUrl: string, bucket: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase is not configured');
    }

    // Extract file path from URL
    const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }

    const filePath = urlParts[1];

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete file:', error);
    }
  }
}
