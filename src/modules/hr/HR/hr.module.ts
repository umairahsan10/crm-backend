import { Module } from '@nestjs/common';
import { HrManagementController } from './controllers/hr-management.controller';
import { HrManagementService } from './services/hr-management.service';
import { AdminRequestsController } from './controllers/admin-requests.controller';
import { AdminRequestsService } from './services/admin-requests.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [HrManagementController, AdminRequestsController],
  providers: [HrManagementService, AdminRequestsService],
  exports: [HrManagementService, AdminRequestsService],
})
export class HrManagementModule {}
