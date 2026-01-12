import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. File uploads will not work.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
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
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = folder ? `${folder}/${timestamp}-${sanitizedFileName}` : `${timestamp}-${sanitizedFileName}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
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
