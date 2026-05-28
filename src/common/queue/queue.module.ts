import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { YtDlpModule } from '../yt-dlp/yt-dlp.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [YtDlpModule, FileModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
