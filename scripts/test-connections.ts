#!/usr/bin/env ts-node

/**
 * Connection Testing Utility
 * 
 * Tests both runtime (PgBouncer) and migration (direct) database connections.
 * Provides detailed diagnostics and validation.
 */

import * as dotenv from 'dotenv';
import { ConnectionTestResult } from '../src/database/database.types';
import { createPrismaClient, createDirectPrismaClient, cleanupPrismaClient } from './lib/prisma-client-factory';

// Load environment variables
dotenv.config();

/**
 * Test database connection
 */
async function testConnection(
  url: string,
  name: string,
  usePgBouncer: boolean = true,
): Promise<{ connected: boolean; error?: string; latency?: number }> {
  const startTime = Date.now();
  
  // Use factory to create properly configured PrismaClient
  const client = usePgBouncer
    ? createPrismaClient({ url, usePgBouncer: true })
    : createDirectPrismaClient(url);

  try {
    // Test connection with a simple query
    await client.$connect();
    await client.employee.findFirst({ select: { id: true } });
    const latency = Date.now() - startTime;

    await cleanupPrismaClient(client);

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    await cleanupPrismaClient(client).catch(() => {});

    return {
      connected: false,
      error: error.message,
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Validate URL format
 */
function validateUrl(url: string, name: string): boolean {
  if (!url) {
    console.error(`❌ ${name} is not set`);
    return false;
  }

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    console.error(`❌ ${name} must be a valid PostgreSQL connection string`);
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    console.error(`❌ ${name} is not a valid URL: ${error.message}`);
    return false;
  }
}

/**
 * Test both connections
 */
async function testConnections(): Promise<ConnectionTestResult> {
  console.log('\n🔍 Testing Database Connections...\n');

  const databaseUrl = process.env.DATABASE_URL;
  const directDatabaseUrl = process.env.DIRECT_DATABASE_URL;

  // Validate URLs
  const runtimeUrlValid = validateUrl(databaseUrl || '', 'DATABASE_URL');
  const migrationUrlValid = validateUrl(directDatabaseUrl || '', 'DIRECT_DATABASE_URL');

  if (!runtimeUrlValid || !migrationUrlValid) {
    console.error('\n❌ Invalid configuration. Please check your environment variables.');
    process.exit(1);
  }

  // Test runtime connection (PgBouncer)
  console.log('📡 Testing Runtime Connection (PgBouncer)...');
  const runtimeResult = await testConnection(databaseUrl!, 'Runtime', true);

  if (runtimeResult.connected) {
    console.log(`✅ Runtime connection successful (${runtimeResult.latency}ms)`);
    if (!databaseUrl!.includes('pgbouncer=true') && !databaseUrl!.includes(':6543')) {
      console.warn('⚠️  Warning: DATABASE_URL should point to PgBouncer (port 6543)');
    }
  } else {
    console.error(`❌ Runtime connection failed: ${runtimeResult.error}`);
  }

  console.log('');

  // Test migration connection (Direct)
  console.log('📡 Testing Migration Connection (Direct PostgreSQL)...');
  const migrationResult = await testConnection(directDatabaseUrl!, 'Migration', false);

  if (migrationResult.connected) {
    console.log(`✅ Migration connection successful (${migrationResult.latency}ms)`);
    if (!directDatabaseUrl!.includes(':5432')) {
      console.warn('⚠️  Warning: DIRECT_DATABASE_URL should point to direct PostgreSQL (port 5432)');
    }
  } else {
    console.error(`❌ Migration connection failed: ${migrationResult.error}`);
  }

  console.log('');

  // Summary
  const allConnected = runtimeResult.connected && migrationResult.connected;
  if (allConnected) {
    console.log('✅ All connections successful!\n');
  } else {
    console.error('❌ Some connections failed. Please check your configuration.\n');
    process.exit(1);
  }

  return {
    runtime: runtimeResult,
    migration: migrationResult,
  };
}

// Run tests if executed directly
if (require.main === module) {
  testConnections().catch((error) => {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  });
}

export { testConnections };

