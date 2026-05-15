import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`);
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large. Maximum size is 10MB');
    }

    const url = await this.storageService.uploadImage(file, folder);
    return { url };
  }
}
