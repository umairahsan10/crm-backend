import { Module } from '@nestjs/common';
import { ProductionController } from './controllers/production.controller';
import { ProductionService } from './services/production.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {} 