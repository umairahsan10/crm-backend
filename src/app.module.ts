import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { CompanyModule } from './modules/company/company.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ProductionModule } from './modules/production/production.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SalesModule } from './modules/sales/sales.module';
import { ClientModule } from './modules/client/client.module';
import { AdminModule } from './modules/admin/admin.module';
import { DepartmentsModule } from './modules/Departments/departments.module';
import { RolesModule } from './modules/Roles/roles.module';
import { IndustryModule } from './modules/industry/industry.module';
import { setPrismaService } from './common/constants/department-name.enum';
import { TimezoneUtil } from './common/utils/timezone.util';

@Global() // Make this module global so PrismaService is available everywhere
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    EmployeeModule,
    AdminModule,
    CommunicationModule,
    CompanyModule,
    FinanceModule,
    HrModule,
    MarketingModule,
    CampaignModule,
    ProductionModule,
    ProjectsModule,
    SalesModule,
    ClientModule,
    DepartmentsModule,
    RolesModule,
    IndustryModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, TimezoneUtil],
  exports: [PrismaService, TimezoneUtil], // Export both services globally
})
export class AppModule implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}

  async onModuleInit() {
    // Initialize the PrismaService for the department names utility
    setPrismaService(this.prismaService);
  }
}
