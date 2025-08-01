import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [HrController],
  providers: [HrService, PrismaService],
})
export class HrModule {}
