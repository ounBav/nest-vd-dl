import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import { YtDlpService } from '../yt-dlp/yt-dlp.service';
import { isAllowedMediaUrl } from 'src/utils/mediaChecker/mediaChecker';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;

  constructor(private readonly ytdlpService: YtDlpService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.error('Telegram bot token not set in environment variables!');
      throw new Error('Telegram bot token missing');
    }

    this.bot = new Telegraf(token);

    // Example: simple start command
    this.bot.start((ctx) => {
      ctx.reply(
        `👋 Welcome, ${ctx.from.first_name || 'friend'}!
    
          I can help you download TikTok videos without a watermark.  
          Just send me a valid TikTok video URL and I’ll process it for you.  

          ℹ️ *Tip:* Make sure the link is public and accessible.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📢 Share this bot',
                  switch_inline_query: '', // Opens inline mode for sharing
                },
              ],
            ],
          },
        },
      );
    });

    // Add other handlers here...
    // Listen to text messages that contain TikTok URLs
    this.bot.on('text', async (ctx) => {
      const url = ctx.message.text;

      // Simple TikTok URL regex
      const match = isAllowedMediaUrl(url);
      const usernameMatch = url.match(/^@?([a-zA-Z0-9._-]{1,24})$/);

      if (match) {
        await ctx.reply('Downloading your TikTok video... Please wait.');

        try {
          const filePath = await this.ytdlpService.downloadNoWatermark(url);

          // Send the video file to user
          await ctx.replyWithVideo({ source: fs.createReadStream(filePath) });

          // Delete the file after sending
          fs.unlink(filePath, (err) => {
            if (err) {
              this.logger.error('Failed to delete video file:', err);
            } else {
              this.logger.log(`Deleted file: ${filePath}`);
            }
          });
        } catch (err) {
          this.logger.error('Error downloading TikTok video:', err);
          await ctx.reply('Sorry, failed to download your TikTok video.');
        }
      } else if (usernameMatch) {
        await ctx.reply(
          'Downloading your TikTok video... Please wait. It may take a few minutes',
        );
        try {
          const filePaths = await this.ytdlpService.downloadAllFromUser(url);
          console.log(filePaths);
          if (filePaths.length) {
            for (const filePath of filePaths) {
              // Send the video file to user
              await ctx.replyWithVideo({
                source: fs.createReadStream(filePath),
              });

              // Delete the file after sending
              fs.unlink(filePath, (err) => {
                if (err) {
                  this.logger.error('Failed to delete video file:', err);
                } else {
                  this.logger.log(`Deleted file: ${filePath}`);
                }
              });
            }
          }
          const mp3Files = filePaths.filter((f) => f.endsWith('.mp3'));

          for (const filePath of mp3Files) {
            fs.unlink(filePath, (err) => {
              if (err) {
                this.logger.error('Failed to delete video file:', err);
              } else {
                this.logger.log(`Deleted file: ${filePath}`);
              }
            });
            this.logger.log(`Deleted mp3 file: ${filePath}`);
          }
        } catch (err) {
          this.logger.error('Error downloading TikTok video:', err);
          await ctx.reply('Sorry, failed to download your TikTok video.');
        }
      } else {
        // If message is not TikTok URL
        await ctx.reply('Please send a valid TikTok video URL.');
      }
    });
  }

  async onModuleInit() {
    this.logger.log('Starting Telegram bot...');
    this.bot.launch();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
  }

  getBot() {
    return this.bot;
  }
}
