import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as path from 'path';
import { spawn } from 'child_process';
import { isAllowedMediaUrl } from 'src/utils/mediaChecker/mediaChecker';
import { promises as fsPromises } from 'fs';
import { FileService } from '../file/file.service';

@Injectable()
export class YtDlpService {
  private readonly logger = new Logger(YtDlpService.name);
  private readonly ytDlpPath: string;

  constructor(private readonly fileService: FileService) {
    // Use local yt-dlp executable
    this.ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
    this.logger.log(`YtDlp path: ${this.ytDlpPath}`);
    // ensure downloads dir exists (fire-and-forget)
    this.fileService.ensureDownloadsDir().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to ensure downloads dir', err);
    });
  }

  async downloadNoWatermark(url: string): Promise<string> {
    if (!isAllowedMediaUrl(url)) {
      throw new BadRequestException('URL is not from a supported media site');
    }

    const downloadsDir = this.fileService.getDownloadsDir();
    await this.fileService.ensureDownloadsDir();

    return new Promise((resolve, reject) => {
      const outputFile = path.join(downloadsDir, `${Date.now()}.mp4`);

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

      const proc = spawn('yt-dlp', ytDlpArgs);

      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (error) => {
        this.logger.error('Failed to spawn yt-dlp process', error);
        reject(new InternalServerErrorException('Video download service unavailable. Make sure yt-dlp is installed.'));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(outputFile);
        } else {
          this.logger.error(`yt-dlp exited with code ${code}:`, stderr);
          reject(new InternalServerErrorException('Failed to download video. Check URL and try again.'));
        }
      });
    });
  }

  async downloadAllFromUser(username: string): Promise<string[]> {
    try {
      const downloadsDir = this.fileService.getDownloadsDir();
      await this.fileService.ensureDownloadsDir();

      const result = this.withTimeout(
        new Promise<string[]>(async (resolve, reject) => {
          const clean = username.startsWith('@') ? username.slice(1) : username;
          const outputTemplate = path.join(
            downloadsDir,
            `${clean}-%(id)s-${Date.now()}.%(ext)s`,
          );

          const ytDlpArgs = [
            '--no-warnings',
            '--output',
            outputTemplate,
            '--format',
            'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            `https://www.tiktok.com/@${clean}`,
          ];

          const proc = spawn(this.ytDlpPath, ytDlpArgs);

          let stderr = '';
          let stdout = '';

          proc.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          proc.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          proc.on('error', (error) => {
            this.logger.error('Failed to spawn yt-dlp process for user download', error);
            reject(new InternalServerErrorException('Video download service unavailable.'));
          });

          proc.on('close', async (code) => {
            if (code === 0) {
              try {
                const files = await fsPromises.readdir(downloadsDir);

                const matchedFiles = files
                  .filter(
                    (file) =>
                      file.startsWith(`${clean}-`) &&
                      (file.endsWith('.mp4') ||
                        file.endsWith('.m4a') ||
                        file.endsWith('.webm')),
                  )
                  .map((file) => path.join(downloadsDir, file));

                resolve(matchedFiles);
              } catch (err) {
                reject(
                  new InternalServerErrorException(
                    'Failed to list downloaded files',
                  ),
                );
              }
            } else {
              this.logger.error(`yt-dlp user download failed with code ${code}:`, stderr);
              reject(
                new InternalServerErrorException(
                  'Failed to download user videos. Please try again later.',
                ),
              );
            }
          });
        }),
        10 * 60 * 1000,
        'Download timed out after 10 minutes',
      );

      return result;
    } catch (error) {
      throw new BadRequestException('Unable to download videos');
    }
  }

  async fetchUserVideoIds(username: string): Promise<string[]> {
    const clean = username.startsWith('@') ? username.slice(1) : username;
    const url = `https://www.tiktok.com/@${clean}`;

    return new Promise<string[]>((resolve, reject) => {
      const args = ['--no-warnings', '--flat-playlist', '--get-id', url];
      const proc = spawn(this.ytDlpPath, args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (error) => {
        this.logger.error('Failed to spawn yt-dlp process for fetching ids', error);
        reject(new InternalServerErrorException('Video list service unavailable.'));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          const ids = stdout
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          resolve(ids);
        } else {
          this.logger.error(`yt-dlp list fetch failed with code ${code}:`, stderr);
          reject(new InternalServerErrorException('Failed to fetch video list from user.'));
        }
      });
    });
  }

  async downloadAllFromUserQueue(username: string, delayMs = 5000): Promise<string[]> {
    const clean = username.startsWith('@') ? username.slice(1) : username;
    const ids = await this.fetchUserVideoIds(clean);

    if (!ids || ids.length === 0) {
      throw new BadRequestException('No videos found for this user');
    }

    const files: string[] = [];

    for (const id of ids) {
      const videoUrl = `https://www.tiktok.com/@${clean}/video/${id}`;
      try {
        const file = await this.downloadNoWatermark(videoUrl);
        files.push(file);
      } catch (err) {
        this.logger.error(`Failed to download video ${videoUrl}`, err);
      }

      // wait between downloads
      await new Promise((r) => setTimeout(r, delayMs));
    }

    return files;
  }

  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message: string,
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() =>
      clearTimeout(timeoutId),
    );
  }
}
