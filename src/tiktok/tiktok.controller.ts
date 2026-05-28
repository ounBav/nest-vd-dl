import { Controller, Get, Query, Res } from '@nestjs/common';
import { TikTokService } from './tiktok.service';
import { Response } from 'express';
import * as path from 'path';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DownloadVideoDto, DownloadUsernameDto } from './ticktok.dto';

@ApiTags('TikTok')
@Controller('tiktok')
export class TikTokController {
  constructor(private readonly tiktokService: TikTokService) {}

  @Get('download')
  @ApiQuery({ name: 'url', required: true, description: 'TikTok video URL' })
  @ApiResponse({ status: 200, description: 'Video downloaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request: URL missing or invalid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async download(@Query() query: DownloadVideoDto, @Res() res: Response) {
    const filePath = await this.tiktokService.downloadNoWatermark(query.url);
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) console.error(err);
    });
  }

  @Get('downloads')
  @ApiQuery({
    name: 'username',
    required: true,
    description: 'TikTok username or handle',
  })
  @ApiResponse({ status: 200, description: 'Videos downloaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request: username missing or invalid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async downloads(@Query() query: DownloadUsernameDto, @Res() res: Response) {
    const filePaths = await this.tiktokService.downloadNoWatermarkByUserName(
      query.username,
    );

    for (const filePath of filePaths) {
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) console.error(err);
      });
    }
  }

  @Get('queue')
  @ApiQuery({ name: 'username', required: true, description: 'TikTok username or handle' })
  @ApiQuery({ name: 'delay', required: false, description: 'Delay between downloads in ms (default 5000)' })
  @ApiResponse({ status: 202, description: 'Queue started' })
  async queueDownloads(@Query() query: any, @Res() res: Response) {
    const username = query.username;
    const delay = query.delay ? Number(query.delay) : 5000;

    // perform queued downloads sequentially and return result when finished
    try {
      const files = await this.tiktokService.downloadAllFromUserQueue(username, delay);
      res.status(200).json({ files });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to queue downloads' });
    }
  }
}
