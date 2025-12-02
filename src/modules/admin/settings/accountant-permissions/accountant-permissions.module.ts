import { Module } from '@nestjs/common';
import { AccountantPermissionsController } from './accountant-permissions.controller';
import { AccountantPermissionsService } from './accountant-permissions.service';

@Module({
  controllers: [AccountantPermissionsController],
  providers: [AccountantPermissionsService],
  exports: [AccountantPermissionsService],
})
export class AccountantPermissionsModule {}
