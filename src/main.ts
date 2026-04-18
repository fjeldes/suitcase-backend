import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 1. HABILITAR CORS: Crucial para que no te dé error de seguridad al llamar desde la App
  app.enableCors()

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // 2. ESCUCHAR EN '0.0.0.0': Esto permite que tu celular (en la misma red) se conecte
  // El puerto sigue siendo el de tu .env o el 3000 por defecto
  const port = process.env.PORT ?? 3000;
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend corriendo en: http://192.168.1.8:${port}`);
  console.log(`📱 Tu celular ya puede conectarse usando esa IP`);
}
bootstrap()