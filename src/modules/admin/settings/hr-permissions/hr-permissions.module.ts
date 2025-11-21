import { Module } from '@nestjs/common';
import { HrPermissionsController } from './hr-permissions.controller';
import { HrPermissionsService } from './hr-permissions.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Module({
  controllers: [HrPermissionsController],
  providers: [HrPermissionsService, PrismaService],
  exports: [HrPermissionsService],
})
export class HrPermissionsModule {}

