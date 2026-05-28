import { Module } from '@nestjs/common';
import { YtDlpService } from './yt-dlp.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  providers: [YtDlpService],
  exports: [YtDlpService],
})
export class YtDlpModule {}
