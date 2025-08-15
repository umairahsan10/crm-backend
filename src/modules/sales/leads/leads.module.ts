import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import { LeadsAccessGuard, LeadCreationGuard } from './guards';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, PrismaService, LeadsAccessGuard, LeadCreationGuard],
  exports: [LeadsService]
})
export class LeadsModule {}
