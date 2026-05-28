import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { isAllowedMediaUrl } from '../../utils/mediaChecker/mediaChecker';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;

  constructor(private readonly queueService: QueueService) {
    const rawToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!rawToken) {
      this.logger.warn(
        'Telegram bot token missing; Telegram bot startup disabled.',
      );
      return;
    }

    const token = this.normalizeTelegramToken(rawToken);
    if (!token) {
      this.logger.error(
        'Telegram bot token is invalid. Please provide a raw bot token like 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11.',
      );
      return;
    }

    this.logger.log(
      `Telegram bot token loaded (${token.length} chars, first 8 chars: ${token.slice(
        0,
        8,
      )})`,
    );

    this.bot = new Telegraf(token);

    // Example: simple start command
    this.bot.start((ctx) => {
      ctx.reply(
        `👋 Welcome, ${ctx.from.first_name || 'friend'}!\n\nI can help you download TikTok or Facebook videos without a watermark.\nJust send me a valid TikTok or Facebook video URL and I’ll process it for you.\n\nℹ️ *Tip:* Make sure the link is public and accessible.`,
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
    // Listen to text messages that contain supported social video URLs
    this.bot.on('text', async (ctx) => {
      const url = ctx.message.text;

      // Simple TikTok URL regex
      const match = isAllowedMediaUrl(url);
      const usernameMatch = url.match(/^@?([a-zA-Z0-9._-]{1,24})$/);

      if (match) {
        // enqueue single video download
        this.queueService.enqueueDownload(ctx, url);
      } else if (usernameMatch) {
        const username = usernameMatch[1];
        this.queueService.enqueueDownloadByUser(ctx, username);
      } else {
        // If message is not supported URL
        await ctx.reply('Please send a valid supported video URL.');
      }
    });
  }

  async onModuleInit() {
    if (!this.bot) {
      this.logger.warn(
        'Telegram bot not started because token is unavailable.',
      );
      return;
    }

    this.logger.log('🚀 Launching Telegram bot...');

    try {
      const botInfo = await this.bot.telegram.getMe();
      this.logger.log(`✅ Bot connected: @${botInfo.username}`);
      await this.bot.launch();
      this.logger.log('✅ Bot is polling for updates');
    } catch (error) {
      this.logger.error(
        `❌ Bot launch failed: ${(error as Error).message}`,
      );
      this.bot = null;
    }
  }

  async onModuleDestroy() {
    if (!this.bot) {
      return;
    }

    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
  }

  getBot() {
    return this.bot;
  }

  isConnected(): boolean {
    return this.bot !== null;
  }

  private isValidUrl(text: string): boolean {
    try {
      new URL(text.toLowerCase());
      return true;
    } catch {
      return false;
    }
  }

  private normalizeTelegramToken(token: string): string | null {
    // Remove leading/trailing whitespace
    let normalized = token.trim();

    // Remove surrounding quotes if present (both double and single)
    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))) {
      normalized = normalized.slice(1, -1).trim();
    }

    this.logger.debug(`Token after normalization: ${normalized.substring(0, 20)}...`);

    // Telegram bot token format: numeric_id:alphanumeric_token
    // Examples: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
    const isValidRawToken = /^\d+:[A-Za-z0-9_-]+$/.test(normalized);
    if (isValidRawToken) {
      this.logger.debug('Valid raw token format detected');
      return normalized;
    }

    // Try to extract from full API URL if provided
    const urlMatch = normalized.match(/\/bot([0-9]+:[A-Za-z0-9_-]+)/i);
    if (urlMatch?.[1]) {
      this.logger.debug('Token extracted from URL');
      return urlMatch[1];
    }

    return null;
  }
}
