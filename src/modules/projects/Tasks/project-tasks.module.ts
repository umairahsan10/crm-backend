import { Module, forwardRef } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { AutoLogService } from '../Projects-Logs/auto-log.service';

@Module({
  controllers: [ProjectTasksController],
  providers: [
    ProjectTasksService,
    AutoLogService,
    PrismaService,
    RolesGuard,
    DepartmentsGuard
  ],
  exports: [ProjectTasksService]
})
export class ProjectTasksModule {}
