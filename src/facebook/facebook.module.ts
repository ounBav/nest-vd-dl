import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { YtDlpModule } from 'src/common/yt-dlp/yt-dlp.module';

@Module({
  imports: [YtDlpModule],
  controllers: [FacebookController],
  providers: [FacebookService],
})
export class FacebookModule {}
