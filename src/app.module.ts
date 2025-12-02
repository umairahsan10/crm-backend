import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { databaseValidationSchema } from './config/validation.schema';
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
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DepartmentNamesModule } from './common/services/department-names.module';
import { JwtConfigModule } from './config/jwt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
      validationSchema: databaseValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule, // Global DatabaseModule provides database configuration
    PrismaModule, // Global PrismaModule provides PrismaService everywhere
    DepartmentNamesModule, // Global DepartmentNamesModule provides DepartmentNamesService everywhere
    JwtConfigModule, // Global JwtConfigModule provides JwtConfigService everywhere
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
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  // DepartmentNamesService is now properly injected via DepartmentNamesModule
  // No need for manual initialization or global variable patterns
}
