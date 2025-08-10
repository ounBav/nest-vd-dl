import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { isAllowedMediaUrl } from 'src/utils/mediaChecker/mediaChecker';
import pTimeout from 'p-timeout';
import { promises as fsPromises } from 'fs';

@Injectable()
export class YtDlpService {
  private downloadsDir = path.join(process.cwd(), 'downloads');
  constructor() {
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir);
    }
  }

  async downloadNoWatermark(url: string): Promise<string> {
    if (!isAllowedMediaUrl(url)) {
      throw new BadRequestException('URL is not from a supported media site');
    }
    return new Promise((resolve, reject) => {
      const outputFile = path.join(this.downloadsDir, `${Date.now()}.mp4`);

      const ytDlpArgs = [
        '--no-warnings',
        '--no-call-home',
        '--quiet',
        '--output',
        outputFile,
        '--no-check-certificate',
        '--no-part',
        '--format',
        'mp4',
        '--no-playlist',
        '--no-overwrites',
        '--trim-filenames',
        '100',
        '--force-overwrites',
        '--remux-video',
        'mp4',
        '--no-warnings',
        '--no-mtime',
        '--cookies',
        'cookies.txt', // optional if account cookies needed
        '--',
        url,
      ];
      const process = spawn('yt-dlp', ytDlpArgs);

      process.on('close', (code) => {
        if (code === 0) {
          resolve(outputFile);
        } else {
          reject(new InternalServerErrorException('Failed to download video'));
        }
      });
    });
  }

  async downloadAllFromUser(username: string): Promise<string[]> {
    console.log(`Downloading videos for username: ${username}`);

    return pTimeout(
      new Promise<string[]>(async (resolve, reject) => {
        const outputTemplate = path.join(
          this.downloadsDir,
          `${username}-%(id)s-${Date.now()}.%(ext)s`,
        );

        const ytDlpArgs = [
          '--no-warnings',
          '--output',
          outputTemplate,
          '--format',
          'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
          `https://www.tiktok.com/${username}`,
        ];

        const process = spawn('yt-dlp', ytDlpArgs);

        let stderr = '';
        let stdout = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', async (code) => {
          if (code === 0) {
            try {
              // Read files in download directory
              const files = await fsPromises.readdir(this.downloadsDir);

              // Filter files by username prefix and .mp4 extension
              const matchedFiles = files
                .filter(
                  (file) =>
                    file.startsWith(`${username}-`) && file.endsWith('.mp4'),
                )
                .map((file) => path.join(this.downloadsDir, file));

              resolve(matchedFiles);
            } catch (err) {
              reject(
                new InternalServerErrorException(
                  'Failed to list downloaded files',
                ),
              );
            }
          } else {
            console.error('yt-dlp error:', stderr);
            reject(
              new InternalServerErrorException(
                'Failed to download user videos',
              ),
            );
          }
        });
      }),
      10 * 60 * 1000, // 10 minutes timeout
      () => {
        throw new Error('Download timed out after 10 minutes');
      },
    );
  }
}
