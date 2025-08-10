import { Module } from '@nestjs/common';
import { TikTokModule } from './tiktok/tiktok.module';
import { TelegramModule } from './common/telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigModule global (no need to import everywhere)
      envFilePath: '.env', // default, can customize
    }),
    TelegramModule,
    TikTokModule,
  ],
})
export class AppModule {}
