import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MonthlyLatesResetTrigger } from './triggers/monthly-lates-reset.trigger';
import { QuarterlyLeavesUpdateTrigger } from './triggers/quarterly-leaves-update.trigger';
import { WeekendAutoPresentTrigger } from './triggers/weekend-auto-present.trigger';
import { FutureHolidayTrigger } from './triggers/future-holiday-trigger';
import { AutoCheckoutTrigger } from './triggers/auto-checkout.trigger';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AttendanceController, HolidayController],
          providers: [
          AttendanceService,
          HolidayService,
          PrismaService,
          MonthlyLatesResetTrigger,
          QuarterlyLeavesUpdateTrigger,
          WeekendAutoPresentTrigger,
          FutureHolidayTrigger,
          AutoCheckoutTrigger
        ],
})
export class AttendanceModule {}
