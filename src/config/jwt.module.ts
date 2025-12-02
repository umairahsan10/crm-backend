import { Global, Module } from '@nestjs/common';
import { JwtConfigService } from './jwt.config';

/**
 * JWT Configuration Module
 *
 * Global module that provides JwtConfigService throughout the application.
 * This module is marked as @Global() to allow easy injection without importing
 * the module in every feature module.
 */
@Global()
@Module({
  providers: [JwtConfigService],
  exports: [JwtConfigService],
})
export class JwtConfigModule {}
