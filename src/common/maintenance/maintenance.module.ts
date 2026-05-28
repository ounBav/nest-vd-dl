import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { FileModule } from '../file/file.module';

@Module({
  imports: [FileModule],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
