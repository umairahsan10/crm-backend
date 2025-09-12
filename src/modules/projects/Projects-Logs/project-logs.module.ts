import { Module } from '@nestjs/common';
import { ProjectLogsService } from './project-logs.service';
import { ProjectLogsController } from './project-logs.controller';
import { AutoLogService } from './auto-log.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';

@Module({
  controllers: [ProjectLogsController],
  providers: [
    ProjectLogsService,
    AutoLogService,
    PrismaService,
    RolesGuard,
    DepartmentsGuard
  ],
  exports: [ProjectLogsService, AutoLogService]
})
export class ProjectLogsModule {}
