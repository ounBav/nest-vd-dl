import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
    .setTitle('TikTok Scraper API')
    .setDescription('API to download TikTok videos without watermark')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT;
  if (!port) {
    console.warn(
      '⚠️  No PORT environment variable found — defaulting to 3000 (local only).',
    );
  }

  await app.listen(port || 3001);
  console.log(`🚀 App running on port ${port || 3001}`);
}
bootstrap();
