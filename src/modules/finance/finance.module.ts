import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceSalaryModule } from './salary/salary.module';
import { AccountantModule } from './accountant/accountant.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AssetsModule } from './accountant/assets/assets.module';
import { ExpenseModule } from './accountant/expense/expense.module';
import { RevenueModule } from './accountant/revenue/revenue.module';
import { LiabilitiesModule } from './accountant/liabilities/liabilities.module';

@Module({
  imports: [
    FinanceSalaryModule,
    AccountantModule,
    AssetsModule,
    ExpenseModule,
    RevenueModule,
    LiabilitiesModule,
  ],
  controllers: [FinanceController, AnalyticsController],
  providers: [FinanceService, AnalyticsService],
  exports: [FinanceService, AnalyticsService],
})
export class FinanceModule {}
