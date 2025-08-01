import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';

import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FinanceModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}
