#!/usr/bin/env ts-node

/**
 * Migration Helper
 * 
 * Provides a type-safe interface for running Prisma migrations
 * with proper environment variable handling and safety checks.
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { MigrationConfig, MigrationResult } from '../src/database/database.types';

// Load environment variables
dotenv.config();

/**
 * Validate migration configuration
 */
function validateMigrationConfig(config: MigrationConfig): void {
  if (!config.directUrl) {
    throw new Error('DIRECT_DATABASE_URL is required for migrations');
  }

  // Safety checks for production
  if (process.env.NODE_ENV === 'production') {
    if (config.mode === 'reset') {
      throw new Error('❌ RESET migrations are not allowed in production!');
    }

    if (config.mode === 'push') {
      throw new Error('❌ DB PUSH is not allowed in production! Use migrations instead.');
    }

    if (!config.force && config.mode === 'deploy') {
      console.warn('⚠️  Running migrations in production. Ensure you have backups!');
    }
  }
}

/**
 * Build Prisma migration command
 */
function buildMigrationCommand(config: MigrationConfig): string {
  const baseCommand = 'npx prisma migrate';

  switch (config.mode) {
    case 'dev':
      const nameArg = config.name ? ` --name ${config.name}` : '';
      const createOnlyArg = config.createOnly ? ' --create-only' : '';
      return `${baseCommand} dev${nameArg}${createOnlyArg}`;

    case 'deploy':
      return `${baseCommand} deploy`;

    case 'reset':
      return `${baseCommand} reset${config.force ? ' --force' : ''}`;

    case 'push':
      return 'npx prisma db push';

    default:
      throw new Error(`Unknown migration mode: ${config.mode}`);
  }
}

/**
 * Execute migration
 */
export function executeMigration(config: MigrationConfig): MigrationResult {
  try {
    validateMigrationConfig(config);

    // Override DATABASE_URL with DIRECT_DATABASE_URL
    process.env.DATABASE_URL = config.directUrl;

    console.log(`\n🔄 Running migration: ${config.mode}`);
    console.log(`📍 Using direct database connection (port 5432)`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

    const command = buildMigrationCommand(config);
    console.log(`📝 Command: ${command}\n`);

    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: config.directUrl,
      },
    });

    return {
      success: true,
      message: `Migration ${config.mode} completed successfully`,
      migrationName: config.name,
    };
  } catch (error) {
    return {
      success: false,
      message: `Migration ${config.mode} failed`,
      error: error.message,
    };
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] as MigrationConfig['mode'];

  if (!mode || !['dev', 'deploy', 'reset', 'push'].includes(mode)) {
    console.error('Usage: ts-node migration-helper.ts <mode> [options]');
    console.error('Modes: dev, deploy, reset, push');
    process.exit(1);
  }

  const config: MigrationConfig = {
    mode,
    directUrl: process.env.DIRECT_DATABASE_URL || '',
    name: args.includes('--name') ? args[args.indexOf('--name') + 1] : undefined,
    force: args.includes('--force'),
    createOnly: args.includes('--create-only'),
  };

  const result = executeMigration(config);

  if (!result.success) {
    console.error(`\n❌ ${result.message}`);
    if (result.error) {
      console.error(`Error: ${result.error}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ ${result.message}`);
}

