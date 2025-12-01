import { Module } from '@nestjs/common';
import { SalaryModule } from './salary/salary.module';
import { EmployeeModule } from './Employee/employee.module';
import { SalesModule } from './Sales/sales.module';
import { ProductionModule } from './Production/production.module';
import { MarketingModule } from './Marketing/marketing.module';
import { HrManagementModule } from './HR/hr.module';
import { AccountsModule } from './Accounts/accounts.module';
import { AccountantsModule } from './Accountants/accountants.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LogsModule } from './view_logs/logs.module';
import { FinanceModule } from '../finance/finance.module';


@Module({
  imports: [
    FinanceModule, 
    SalaryModule, 
    EmployeeModule, 
    SalesModule, 
    ProductionModule, 
    MarketingModule, 
    HrManagementModule, 
    AccountsModule,
    AccountantsModule,
    AttendanceModule,
    LogsModule,
  ],
})
export class HrModule {}