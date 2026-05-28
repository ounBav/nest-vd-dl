import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FacebookService } from './facebook.service';
import { FacebookDownloadVideoDto } from './facebook.dto';

@ApiTags('Facebook')
@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Get('download')
  @ApiQuery({ name: 'url', required: true, description: 'Facebook video URL' })
  @ApiResponse({ status: 200, description: 'Video downloaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request: URL missing or invalid',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async download(
    @Query() query: FacebookDownloadVideoDto,
    @Res() res: Response,
  ) {
    const filePath = await this.facebookService.downloadNoWatermark(query.url);
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) console.error(err);
    });
  }
}
