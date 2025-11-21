import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { UnitsModule } from './units/units.module';
import { TeamsModule } from './teams/teams.module';
import { CommissionsModule } from './commissions/commissions.module';
import { PaymentsModule } from './leads/payments/payments.module';

@Module({
  imports: [LeadsModule, UnitsModule, TeamsModule, CommissionsModule, PaymentsModule],
})
export class SalesModule {}
