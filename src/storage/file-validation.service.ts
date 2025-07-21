import { Injectable } from '@nestjs/common';

@Injectable()
export class FileValidationService {
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  validateImageFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    return { isValid: true };
  }

  validateMultipleImageFiles(files: Express.Multer.File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const validation = this.validateImageFile(files[i]);
      if (!validation.isValid) {
        errors.push(`File ${i + 1}: ${validation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
