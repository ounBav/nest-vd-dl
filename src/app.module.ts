import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import { ScheduleModule } from '@nestjs/schedule';
import { TikTokModule } from './tiktok/tiktok.module';
import { FacebookModule } from './facebook/facebook.module';
import { TelegramModule } from './common/telegram/telegram.module';
import { MaintenanceModule } from './common/maintenance/maintenance.module';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
      cache: true,
    }),
    WinstonModule.forRoot({
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.errors({ stack: true }),
            format.splat(),
            format.printf(({ timestamp, level, message, stack }) =>
              stack
                ? `${timestamp} [${level}] ${message} - ${stack}`
                : `${timestamp} [${level}] ${message}`,
            ),
          ),
        }),
      ],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 10,
          ttl: 60,
        },
      ],
    }),
    TelegramModule,
    TikTokModule,
    FacebookModule,
    MaintenanceModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
