import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceSalaryModule } from './salary/salary.module';
import { AccountantModule } from './accountant/accountant.module';

@Module({
  imports: [FinanceSalaryModule, AccountantModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
