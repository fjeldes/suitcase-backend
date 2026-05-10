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
    console.log(`[Storage] Intentando subir imagen a la carpeta: ${folder}`);
    console.log(`[Storage] Archivo recibido:`, file ? { name: file.originalname, size: file.size } : 'Ninguno');

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const url = await this.storageService.uploadImage(file, folder);
    console.log(`[Storage] Subida exitosa. URL: ${url}`);
    return { url };
  }
}
