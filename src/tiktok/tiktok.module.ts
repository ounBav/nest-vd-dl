import { Module } from '@nestjs/common';
import { TikTokService } from './tiktok.service';
import { TikTokController } from './tiktok.controller';
import { YtDlpModule } from 'src/common/yt-dlp/yt-dlp.module';

@Module({
  imports:[YtDlpModule],
  controllers: [TikTokController],
  providers: [TikTokService],
})
export class TikTokModule {}
