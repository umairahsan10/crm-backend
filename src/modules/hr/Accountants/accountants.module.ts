import { Module } from '@nestjs/common';
import { AccountantController } from './controllers/accountant.controller';
import { AccountantService } from './services/accountant.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [AccountantController],
  providers: [AccountantService],
  exports: [AccountantService],
})
export class AccountantsModule {} 