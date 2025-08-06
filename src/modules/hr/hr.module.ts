import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { SalaryModule } from './salary/salary.module';

import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FinanceModule, SalaryModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
