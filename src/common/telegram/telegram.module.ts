import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { YtDlpModule } from '../yt-dlp/yt-dlp.module';

@Module({
  imports: [YtDlpModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
