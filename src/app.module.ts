import { Module, Global } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { CompanyModule } from './modules/company/company.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SalesModule } from './modules/sales/sales.module';

@Global() // Make this module global so PrismaService is available everywhere
@Module({
  imports: [
    AuthModule,
    EmployeeModule,
    CommunicationModule,
    CompanyModule,
    FinanceModule,
    HrModule,
    MarketingModule,
    ProjectsModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
  exports: [PrismaService], // Export PrismaService so it can be used by guards
})
export class AppModule {}
