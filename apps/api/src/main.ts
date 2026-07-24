import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS_ORIGIN acepta una lista separada por comas (ej: "https://www.margariteno.com,https://margariteno.com").
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.setGlobalPrefix('api');

  // Cloud Run / App Hosting inyectan PORT (usualmente 8080) y requieren escuchar en 0.0.0.0.
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Foratour API corriendo en el puerto ${port} (prefijo /api). Orígenes CORS: ${allowedOrigins.join(', ')}`);
}

bootstrap();
