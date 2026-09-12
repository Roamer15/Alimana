import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No files provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('This file format is not accepted');
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException('File too large (max 5MB)');
    }
    console.log('Uploading file:', file.originalname, file.mimetype, file.size);

    return file;
  }
}
