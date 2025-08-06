import { Module } from '@nestjs/common';
import { UnitsModule } from './units/units.module';

@Module({
  imports: [UnitsModule],
  exports: [UnitsModule]
})
export class ProductionModule {} 