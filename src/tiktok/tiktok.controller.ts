import { Controller, Get, Query, Res } from '@nestjs/common';
import { TikTokService } from './tiktok.service';
import { Response } from 'express';
import * as path from 'path';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

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
  async download(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send({ error: 'URL is required' });

    const filePath = await this.tiktokService.downloadNoWatermark(url);
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) console.error(err);
    });
  }

  @Get('downloads')
  @ApiQuery({ name: 'username', required: true, description: 'TikTok video URL' })
  @ApiResponse({ status: 200, description: 'Video downloaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request: URL missing or invalid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async downloads(@Query('username') username: string, @Res() res: Response) {
    if (!username) return res.status(400).send({ error: 'URL is required' });

    const filePaths =
      await this.tiktokService.downloadNoWatermarkByUserName(username);
    filePaths.map((filePath) => {
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) console.error(err);
      });
    });
  }
}
