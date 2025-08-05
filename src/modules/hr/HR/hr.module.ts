import { Module } from '@nestjs/common';
import { HrManagementController } from './controllers/hr-management.controller';
import { HrManagementService } from './services/hr-management.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [HrManagementController],
  providers: [HrManagementService, PrismaService],
  exports: [HrManagementService],
})
export class HrManagementModule {} 