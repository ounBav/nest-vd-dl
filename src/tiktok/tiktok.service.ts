import { Injectable } from '@nestjs/common';
import { YtDlpService } from 'src/common/yt-dlp/yt-dlp.service';

@Injectable()
export class TikTokService {

  constructor(private readonly ytdlpService: YtDlpService) {}

  async downloadNoWatermark(url: string): Promise<string> {
    return this.ytdlpService.downloadNoWatermark(url)
  }

  async downloadNoWatermarkByUserName(username: string): Promise<string[]> {
    return this.ytdlpService.downloadAllFromUser(username)
  }
}
