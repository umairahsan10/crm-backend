import { Module } from '@nestjs/common';
import { SalaryModule } from './salary/salary.module';
import { EmployeeModule } from './Employee/employee.module';

import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FinanceModule, SalaryModule, EmployeeModule],
})
export class HrModule {}
