import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, JwtAuthGuard, DepartmentsGuard],
  exports: [CampaignService]
})
export class CampaignModule {}
