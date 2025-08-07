import { Module } from '@nestjs/common';
import { UnitsModule } from './units/units.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [UnitsModule, TeamsModule],
  exports: [UnitsModule, TeamsModule]
})
export class ProductionModule {} 