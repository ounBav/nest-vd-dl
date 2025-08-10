import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class DownloadVideoDto {
  @ApiProperty({ description: 'TikTok video URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}
