import { Module } from '@nestjs/common';
import { IndustryController } from './industry.controller';
import { IndustryService } from './industry.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [IndustryController],
  providers: [IndustryService, PrismaService],
  exports: [IndustryService]
})
export class IndustryModule {}

