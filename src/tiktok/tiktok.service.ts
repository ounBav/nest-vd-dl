import { Injectable } from '@nestjs/common';
import { YtDlpService } from '../common/yt-dlp/yt-dlp.service';

@Injectable()
export class TikTokService {
  constructor(private readonly ytdlpService: YtDlpService) {}

  async downloadNoWatermark(url: string): Promise<string> {
    return this.ytdlpService.downloadNoWatermark(url);
  }

  async downloadNoWatermarkByUserName(username: string): Promise<string[]> {
    return this.ytdlpService.downloadAllFromUser(username);
  }

  async downloadAllFromUserQueue(username: string, delayMs = 5000): Promise<string[]> {
    return this.ytdlpService.downloadAllFromUserQueue(username, delayMs);
  }
}
