import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LateLogsService } from './late-logs.service';
import { HalfDayLogsService } from './half-day-logs.service';
import { LeaveLogsService } from './leave-logs.service';
import { ProjectLogsService } from './project-logs.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  controllers: [LogsController],
  providers: [
    LateLogsService,
    HalfDayLogsService,
    LeaveLogsService,
    ProjectLogsService,
    PrismaService
  ],
  exports: [
    LateLogsService,
    HalfDayLogsService,
    LeaveLogsService,
    ProjectLogsService
  ]
})
export class LogsModule {}

