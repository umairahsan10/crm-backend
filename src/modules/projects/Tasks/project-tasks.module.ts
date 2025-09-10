import { Module } from '@nestjs/common';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectTasksController } from './project-tasks.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';

@Module({
  controllers: [ProjectTasksController],
  providers: [
    ProjectTasksService,
    PrismaService,
    RolesGuard,
    DepartmentsGuard
  ],
  exports: [ProjectTasksService]
})
export class ProjectTasksModule {}
