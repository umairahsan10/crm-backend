import { Module, forwardRef } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { AutoLogService } from '../Projects-Logs/auto-log.service';

@Module({
  controllers: [ProjectTasksController],
  providers: [
    ProjectTasksService,
    AutoLogService,
    RolesGuard,
    DepartmentsGuard,
  ],
  exports: [ProjectTasksService],
})
export class ProjectTasksModule {}
