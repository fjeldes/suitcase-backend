import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get<string>('storage.projectId'),
      credentials: {
        client_email: this.configService.get<string>('storage.clientEmail'),
        private_key: this.configService.get<string>('storage.privateKey')?.replace(/\\n/g, '\n'),
      },
    });
    this.bucketName = this.configService.get<string>('storage.bucketName') || '';
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileName = `${folder}/${uniqueId}-${file.originalname.replace(/\s/g, '_').split('.')[0]}.webp`;
      const fileUpload = bucket.file(fileName);

      console.log(`[Storage] Procesando imagen con Sharp...`);
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      
      console.log(`[Storage] Imagen procesada. Tamaño final: ${optimizedBuffer.length} bytes. Subiendo a GCS...`);

      const blobStream = fileUpload.createWriteStream({
        resumable: false,
        contentType: 'image/webp',
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          console.error('[Storage] ERROR DETALLADO DE GOOGLE:', err);
          reject(new InternalServerErrorException('Error uploading to Google Cloud Storage'));
        });

        blobStream.on('finish', async () => {
          try {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
            console.log(`[Storage] Subida exitosa y archivo hecho público. URL: ${publicUrl}`);
            resolve(publicUrl);
          } catch (makePublicError) {
            console.error('[Storage] Error al hacer público el archivo:', makePublicError);
            // Intentamos devolver la URL de todas formas, por si el bucket ya es público por defecto
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
            resolve(publicUrl);
          }
        });

        blobStream.end(optimizedBuffer);
      });
    } catch (error) {
      console.error('[Storage] Error general en uploadImage:', error);
      throw new InternalServerErrorException('Error processing or uploading image');
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      if (!url || !url.includes(this.bucketName)) return;

      // Extraer el path del archivo de la URL:
      // De: https://storage.googleapis.com/bucket-name/folder/file.webp
      // A: folder/file.webp
      const path = url.split(`${this.bucketName}/`)[1];
      if (!path) return;

      const file = this.storage.bucket(this.bucketName).file(path);
      const [exists] = await file.exists();

      if (exists) {
        await file.delete();
        console.log(`[Storage] Archivo antiguo eliminado: ${path}`);
      }
    } catch (error) {
      // No lanzamos excepción para que no falle la subida de la nueva foto
      // si por alguna razón falla el borrado de la vieja.
      console.error('[Storage] Error al intentar borrar archivo antiguo:', error);
    }
  }
}
