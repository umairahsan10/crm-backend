import { Module } from '@nestjs/common';
import { AllLogsController } from './all-logs.controller';
import { AttendanceModule } from '../hr/attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeModule } from '../hr/Employee/employee.module';
import { ProjectLogsModule } from '../projects/Projects-Logs/project-logs.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    AttendanceModule,
    AuthModule,
    EmployeeModule,
    ProjectLogsModule,
    FinanceModule,
  ],
  controllers: [AllLogsController],
  exports: [],
})
export class AllLogsModule {}

