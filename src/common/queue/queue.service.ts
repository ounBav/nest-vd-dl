import { Injectable, Logger } from '@nestjs/common';
import { YtDlpService } from '../yt-dlp/yt-dlp.service';
import { FileService } from '../file/file.service';
import * as fs from 'fs';

type JobSingle = { type: 'single'; ctx: any; url: string };
type JobUser = { type: 'user'; ctx: any; username: string };
type Job = JobSingle | JobUser;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queue: Job[] = [];
  private processing = false;

  constructor(
    private readonly ytdlpService: YtDlpService,
    private readonly fileService: FileService,
  ) {}

  enqueueDownload(ctx: any, url: string) {
    this.queue.push({ type: 'single', ctx, url });
    this.logger.log(
      `Enqueued download for ${url}. Queue size: ${this.queue.length}`,
    );
    this.processNext();
  }

  enqueueDownloadByUser(ctx: any, username: string) {
    this.queue.push({ type: 'user', ctx, username });
    this.logger.log(
      `Enqueued user download for ${username}. Queue size: ${this.queue.length}`,
    );
    this.processNext();
  }

  private async processNext() {
    if (this.processing) return;
    const job = this.queue.shift();
    if (!job) return;

    this.processing = true;

    try {
      if (job.type === 'single') {
        const { ctx, url } = job;
        await ctx.reply(
          'Processing your download — I will send it when ready.',
        );
        const filePath = await this.ytdlpService.downloadNoWatermark(url);
        await ctx.replyWithVideo({ source: fs.createReadStream(filePath) });
        await this.fileService.removeFile(filePath);
        this.logger.log(`Job complete for ${url}`);
      } else {
        const { ctx, username } = job;
        await ctx.reply('Processing user videos — this can take a while.');
        const filePaths = await this.ytdlpService.downloadAllFromUser(username);
        for (const filePath of filePaths) {
          await ctx.replyWithVideo({ source: fs.createReadStream(filePath) });
          await this.fileService.removeFile(filePath);
        }
        this.logger.log(`User job complete for ${username}`);
      }
    } catch (err) {
      this.logger.error('Failed to process job', err as any);
      try {
        // best-effort notify user
        const ctx = (job as any).ctx;
        if (ctx && ctx.reply)
          await ctx.reply('Sorry, failed to download your video.');
      } catch (e) {
        this.logger.warn('Failed to notify user about job failure');
      }
    } finally {
      this.processing = false;
      setImmediate(() => this.processNext());
    }
  }
}
