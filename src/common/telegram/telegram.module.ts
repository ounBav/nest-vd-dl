import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { YtDlpModule } from '../yt-dlp/yt-dlp.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [YtDlpModule, QueueModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
