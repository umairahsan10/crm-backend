import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DepartmentsGuard } from '../../common/guards/departments.guard';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, DepartmentsGuard]
})
export class DashboardModule {}

