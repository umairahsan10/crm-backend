import { Module } from '@nestjs/common';
import { FinanceSalaryService } from './salary.service';
import { FinanceSalaryController } from './salary.controller';

@Module({
  controllers: [FinanceSalaryController],
  providers: [FinanceSalaryService],
  exports: [FinanceSalaryService],
})
export class FinanceSalaryModule {} 