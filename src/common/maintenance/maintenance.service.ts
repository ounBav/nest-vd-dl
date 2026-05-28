import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileService } from '../file/file.service';

@Injectable()
export class MaintenanceService implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceService.name);
  private readonly maxAgeMs =
    Number(process.env.FILE_MAX_AGE_HOURS ?? '24') * 60 * 60 * 1000;

  constructor(private readonly fileService: FileService) {}

  onModuleInit() {
    this.cleanOldFiles();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanOldFiles() {
    this.logger.log(
      `Cleaning up files older than ${this.maxAgeMs / 1000 / 60 / 60} hours`,
    );
    await this.fileService.cleanupOldFiles(this.maxAgeMs);
  }
}
