import { Injectable } from '@nestjs/common';
import { YtDlpService } from '../common/yt-dlp/yt-dlp.service';

@Injectable()
export class FacebookService {
  constructor(private readonly ytdlpService: YtDlpService) {}

  async downloadNoWatermark(url: string): Promise<string> {
    return this.ytdlpService.downloadNoWatermark(url);
  }
}
