import { Module } from '@nestjs/common';
import { HrPermissionsController } from './hr-permissions.controller';
import { HrPermissionsService } from './hr-permissions.service';

@Module({
  controllers: [HrPermissionsController],
  providers: [HrPermissionsService],
  exports: [HrPermissionsService],
})
export class HrPermissionsModule {}
