import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'employees'): Promise<string> {
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
          } else {
            resolve(result.secure_url);
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

