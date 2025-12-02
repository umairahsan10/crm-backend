import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DepartmentsGuard } from '../../common/guards/departments.guard';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DepartmentsGuard],
})
export class DashboardModule {}
