import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { MonthlyLatesResetTrigger } from './triggers/monthly-lates-reset.trigger';
import { QuarterlyLeavesUpdateTrigger } from './triggers/quarterly-leaves-update.trigger';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, MonthlyLatesResetTrigger, QuarterlyLeavesUpdateTrigger],
})
export class AttendanceModule {}
