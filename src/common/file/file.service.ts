import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private downloadsDir: string;

  constructor() {
    this.downloadsDir =
      process.env.DOWNLOADS_PATH || path.join(process.cwd(), 'downloads');
  }

  async ensureDownloadsDir() {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
      return this.downloadsDir;
    } catch (err) {
      this.logger.error('Failed to ensure downloads directory', err as any);
      throw err;
    }
  }

  getDownloadsDir() {
    return this.downloadsDir;
  }

  getDownloadPath(filename: string) {
    return path.join(this.downloadsDir, filename);
  }

  async removeFile(filePath: string) {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Removed file ${filePath}`);
    } catch (err) {
      this.logger.warn(`Failed to remove file ${filePath}: ${err}`);
    }
  }

  // Remove files older than maxAgeMs
  async cleanupOldFiles(maxAgeMs: number) {
    try {
      const files = await fs.readdir(this.downloadsDir);
      const now = Date.now();
      for (const f of files) {
        try {
          const full = path.join(this.downloadsDir, f);
          const stat = await fs.stat(full);
          if (now - stat.mtimeMs > maxAgeMs) {
            await fs.unlink(full);
            this.logger.log(`Cleaned up old file ${full}`);
          }
        } catch (err) {
          this.logger.warn(`Failed to inspect/delete file ${f}: ${err}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to cleanup downloads dir: ${err}`);
    }
  }
}
