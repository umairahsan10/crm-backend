import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { UnitsModule } from './units/units.module';
import { CommissionsModule } from './commissions/commissions.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [LeadsModule, UnitsModule, CommissionsModule, PaymentsModule],
})
export class SalesModule {}
