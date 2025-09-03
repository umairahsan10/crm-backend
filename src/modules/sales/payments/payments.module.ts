import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RevenueService } from '../../finance/accountant/revenue/revenue.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, RevenueService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
