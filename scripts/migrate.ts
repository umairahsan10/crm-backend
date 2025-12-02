#!/usr/bin/env ts-node

/**
 * Migration CLI Wrapper
 * 
 * Simplified CLI interface for running Prisma migrations
 * with automatic environment variable handling.
 */

import { executeMigration } from './migration-helper';
import { MigrationConfig } from '../src/database/database.types';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: ts-node migrate.ts <command> [options]');
  console.error('\nCommands:');
  console.error('  dev [--name <name>] [--create-only]  - Create and apply migration');
  console.error('  deploy                               - Apply pending migrations');
  console.error('  reset [--force]                      - Reset database (dev only)');
  console.error('  push                                 - Push schema (dev only)');
  console.error('\nExamples:');
  console.error('  ts-node migrate.ts dev --name add_user_table');
  console.error('  ts-node migrate.ts deploy');
  process.exit(1);
}

const command = args[0];
const config: MigrationConfig = {
  mode: command as MigrationConfig['mode'],
  directUrl: process.env.DIRECT_DATABASE_URL || '',
  name: args.includes('--name') ? args[args.indexOf('--name') + 1] : undefined,
  force: args.includes('--force'),
  createOnly: args.includes('--create-only'),
};

if (!['dev', 'deploy', 'reset', 'push'].includes(command)) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const result = executeMigration(config);

if (!result.success) {
  console.error(`\n❌ Migration failed: ${result.message}`);
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }
  process.exit(1);
}

console.log(`\n✅ ${result.message}`);

