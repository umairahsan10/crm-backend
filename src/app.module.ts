import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CompanyModule } from './modules/company/company.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [CompanyModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
