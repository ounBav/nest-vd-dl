import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsString } from 'class-validator';

export class DownloadVideoDto {
  @ApiProperty({ description: 'TikTok video URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class DownloadUsernameDto {
  @ApiProperty({
    description: 'TikTok username or handle',
    example: 'example_user',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
