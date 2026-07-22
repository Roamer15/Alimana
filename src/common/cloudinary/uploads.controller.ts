import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ImageValidationPipe } from '../middleware/image-validator.pipe';

@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(new ImageValidationPipe()) file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    const folderName = folder?.trim() || 'misc';

    // Optionnel : contrôle des dossiers autorisés
    const allowedFolders = ['products', 'profiles', 'avatars', 'store'];
    if (!allowedFolders.includes(folderName)) {
      throw new BadRequestException(`Unauthorized file: ${folderName}`);
    }

    const result = await this.cloudinaryService.uploadFile(file, folderName);
    return {
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
