import { Module } from '@nestjs/common';
import { FinanceSalaryService } from './salary.service';
import { FinanceSalaryController } from './salary.controller';
import { MonthlySalaryCronTrigger } from './triggers/monthly-salary-cron.trigger';

@Module({
  controllers: [FinanceSalaryController],
  providers: [FinanceSalaryService, MonthlySalaryCronTrigger],
  exports: [FinanceSalaryService],
})
export class FinanceSalaryModule {} 