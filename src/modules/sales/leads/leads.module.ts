import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  LeadsAccessGuard,
  LeadCreationGuard,
  ArchivedLeadsAccessGuard,
} from './guards';

@Module({
  controllers: [LeadsController],
  providers: [
    LeadsService,
    LeadsAccessGuard,
    LeadCreationGuard,
    ArchivedLeadsAccessGuard,
  ],
  exports: [LeadsService],
})
export class LeadsModule {}
