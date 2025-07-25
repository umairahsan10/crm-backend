import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { UnitsModule } from './units/units.module';
import { CommissionsModule } from './commissions/commissions.module';

@Module({
  imports: [LeadsModule, UnitsModule, CommissionsModule],
})
export class SalesModule {} 