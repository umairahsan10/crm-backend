import { Module } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { AccountantController } from './accountant.controller';
import { AssetsModule } from './assets/assets.module';
import { LiabilitiesModule } from './liabilities/liabilities.module';
import { ExpenseModule } from './expense/expense.module';
import { RevenueModule } from './revenue/revenue.module';

@Module({
  imports: [
    AssetsModule,
    LiabilitiesModule,
    ExpenseModule,
    RevenueModule,
  ],
  controllers: [AccountantController],
  providers: [AccountantService],
})
export class AccountantModule {}
