import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { RevenueService } from '../../../finance/accountant/revenue/revenue.service';
import { ProjectsModule } from '../../../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RevenueService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
