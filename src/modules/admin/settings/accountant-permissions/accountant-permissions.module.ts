import { Module } from '@nestjs/common';
import { AccountantPermissionsController } from './accountant-permissions.controller';
import { AccountantPermissionsService } from './accountant-permissions.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

@Module({
  controllers: [AccountantPermissionsController],
  providers: [AccountantPermissionsService, PrismaService],
  exports: [AccountantPermissionsService],
})
export class AccountantPermissionsModule {}

