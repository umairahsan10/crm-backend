import { Module } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { AccountantController } from './accountant.controller';

@Module({
  controllers: [AccountantController],
  providers: [AccountantService],
})
export class AccountantModule {}
