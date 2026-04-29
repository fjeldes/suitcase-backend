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

  // Middleware rápido para debuguear
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  // En main.ts
app.use((req, res, next) => {
  const oldSend = res.send;

  // Sobrescribimos temporalmente la función send para ver qué sale
  res.send = function (data) {
    console.log(`\n--- [${req.method}] ${req.url} ---`);
    console.log('RESPONSE:', data); 
    console.log('-----------------------------------\n');
    return oldSend.apply(res, arguments);
  };

  next();
});
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend corriendo en: http://192.168.1.8:${port}`);
  console.log(`📱 Tu celular ya puede conectarse usando esa IP`);
}
bootstrap()