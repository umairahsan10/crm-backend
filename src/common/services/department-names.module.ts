import { Global, Module } from '@nestjs/common';
import { DepartmentNamesService } from './department-names.service';
import { PrismaModule } from '../../../prisma/prisma.module';

/**
 * Department Names Module
 *
 * Global module that provides DepartmentNamesService throughout the application.
 * This module is marked as @Global() to allow easy injection without importing
 * the module in every feature module.
 *
 * The service provides cached access to department names with proper dependency
 * injection, replacing the previous global variable pattern.
 */
@Global()
@Module({
  imports: [PrismaModule], // PrismaModule is already global, but explicit for clarity
  providers: [DepartmentNamesService],
  exports: [DepartmentNamesService],
})
export class DepartmentNamesModule {}
