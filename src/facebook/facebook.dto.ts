import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class FacebookDownloadVideoDto {
  @ApiProperty({ description: 'Facebook video URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}
