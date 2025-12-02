import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RolesGuard, DepartmentsGuard } from '../../common/guards';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectAssignmentGuard } from './guards/project-assignment.guard';
import { ProjectTasksModule } from './Tasks/project-tasks.module';
import { ProjectLogsModule } from './Projects-Logs/project-logs.module';

@Module({
  imports: [ProjectTasksModule, ProjectLogsModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    RolesGuard,
    DepartmentsGuard,
    ProjectAccessGuard,
    ProjectAssignmentGuard,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
