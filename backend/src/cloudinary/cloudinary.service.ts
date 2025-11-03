import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️ Cloudinary credentials not configured. Photo uploads will fail.');
      console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
      return;
    }

    // Validate credentials format
    if (cloudName.includes(' ') || apiKey.includes(' ') || apiSecret.includes(' ')) {
      console.error('❌ Cloudinary credentials appear to contain spaces. Please check your environment variables.');
      console.error(`Cloud Name: ${cloudName.substring(0, 10)}...`);
      console.error(`API Key: ${apiKey.substring(0, 10)}...`);
      return;
    }

    try {
      cloudinary.config({
        cloud_name: cloudName.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
      });
      this.isConfigured = true;
      console.log('✅ Cloudinary configured successfully');
      console.log(`   Cloud Name: ${cloudName}`);
      console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
    } catch (error) {
      console.error('❌ Failed to configure Cloudinary:', error);
    }
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'employees'): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    return new Promise((resolve, reject) => {
      if (!file.buffer) {
        reject(new Error('File buffer is missing'));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          format: 'jpg',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result && result.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No secure URL returned from Cloudinary'));
          }
        }
      );

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      // Don't throw - we don't want to fail if deletion fails
    }
  }

  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}

