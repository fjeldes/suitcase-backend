import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.use(helmet())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');
}
bootstrap()