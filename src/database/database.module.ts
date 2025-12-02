import { Global, Module } from '@nestjs/common';
import { DatabaseConfigService } from '../config/database.config';
import { DatabaseService } from './database.service';

/**
 * Database Module
 *
 * Global module providing database configuration and services.
 * Exports DatabaseConfigService and DatabaseService for use
 * throughout the application.
 *
 * Note: ConfigModule should be imported in AppModule, not here,
 * to avoid conflicts and ensure proper initialization order.
 */
@Global()
@Module({
  providers: [DatabaseConfigService, DatabaseService],
  exports: [DatabaseConfigService, DatabaseService],
})
export class DatabaseModule {}
