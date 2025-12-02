/**
 * Prisma Client Factory
 * 
 * Provides a factory function for creating properly configured PrismaClient instances
 * for use in scripts. This ensures scripts use the same configuration as PrismaService,
 * including PgBouncer parameters and connection pooling settings.
 * 
 * This factory prevents connection pool leaks and ensures consistent configuration
 * across the application and scripts.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Configuration options for creating a PrismaClient instance
 */
export interface PrismaClientConfig {
  /**
   * Database connection URL
   * If not provided, will use DATABASE_URL from environment
   */
  url?: string;
  
  /**
   * Whether to add PgBouncer parameters to the connection URL
   * Default: true (for runtime connections)
   */
  usePgBouncer?: boolean;
  
  /**
   * Connection pool limit
   * Default: 10
   */
  connectionLimit?: number;
  
  /**
   * Pool timeout in seconds
   * Default: 20
   */
  poolTimeout?: number;
  
  /**
   * Enable prepared statements
   * Default: false (required for PgBouncer)
   */
  preparedStatements?: boolean;
}

/**
 * Creates a properly configured PrismaClient instance for scripts
 * 
 * @param config - Configuration options for the PrismaClient
 * @returns Configured PrismaClient instance
 * 
 * @example
 * ```typescript
 * const client = createPrismaClient({
 *   url: process.env.DATABASE_URL,
 *   usePgBouncer: true,
 * });
 * 
 * try {
 *   await client.$connect();
 *   // Use client...
 * } finally {
 *   await cleanupPrismaClient(client);
 * }
 * ```
 */
export function createPrismaClient(config: PrismaClientConfig = {}): PrismaClient {
  const {
    url,
    usePgBouncer = true,
    connectionLimit = 10,
    poolTimeout = 20,
    preparedStatements = false,
  } = config;

  // Get database URL from config or environment
  const databaseUrl = url || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Provide it in config or set it as an environment variable.');
  }

  // Build connection URL with PgBouncer parameters if needed
  let finalUrl = databaseUrl;
  
  if (usePgBouncer) {
    const params = new URLSearchParams();
    params.set('pgbouncer', 'true');
    params.set('prepared_statements', String(preparedStatements));
    params.set('connection_limit', String(connectionLimit));
    params.set('pool_timeout', String(poolTimeout));

    // Parse existing URL and merge parameters
    try {
      const urlObj = new URL(databaseUrl);
      const existingParams = new URLSearchParams(urlObj.search);

      // Merge parameters (new params override existing)
      existingParams.forEach((value, key) => {
        if (!params.has(key)) {
          params.set(key, value);
        }
      });

      urlObj.search = params.toString();
      finalUrl = urlObj.toString();
    } catch (error) {
      // If URL parsing fails, append parameters manually
      const separator = databaseUrl.includes('?') ? '&' : '?';
      finalUrl = `${databaseUrl}${separator}${params.toString()}`;
    }
  }

  // Create PrismaClient with configured URL
  const client = new PrismaClient({
    datasources: {
      db: { url: finalUrl },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['warn', 'error'] 
      : ['error'],
  });

  return client;
}

/**
 * Cleanup utility for PrismaClient instances
 * 
 * Properly disconnects a PrismaClient instance to prevent connection leaks.
 * Should always be called in a finally block after using a PrismaClient.
 * 
 * @param client - PrismaClient instance to cleanup
 * 
 * @example
 * ```typescript
 * const client = createPrismaClient();
 * try {
 *   await client.$connect();
 *   // Use client...
 * } finally {
 *   await cleanupPrismaClient(client);
 * }
 * ```
 */
export async function cleanupPrismaClient(client: PrismaClient): Promise<void> {
  try {
    await client.$disconnect();
  } catch (error) {
    // Ignore disconnect errors (client may already be disconnected)
    console.warn('Warning: Error during PrismaClient cleanup:', error.message);
  }
}

/**
 * Creates a PrismaClient for direct database connections (migrations)
 * 
 * This is useful for scripts that need to connect directly to PostgreSQL
 * bypassing PgBouncer (e.g., for migrations or schema operations).
 * 
 * @param url - Direct database URL (defaults to DIRECT_DATABASE_URL env var)
 * @returns Configured PrismaClient for direct connection
 * 
 * @example
 * ```typescript
 * const client = createDirectPrismaClient();
 * try {
 *   await client.$connect();
 *   // Use client for migrations...
 * } finally {
 *   await cleanupPrismaClient(client);
 * }
 * ```
 */
export function createDirectPrismaClient(url?: string): PrismaClient {
  const directUrl = url || process.env.DIRECT_DATABASE_URL;
  
  if (!directUrl) {
    throw new Error('DIRECT_DATABASE_URL is required. Provide it as parameter or set it as an environment variable.');
  }

  // Direct connections don't need PgBouncer parameters
  return createPrismaClient({
    url: directUrl,
    usePgBouncer: false,
    preparedStatements: true, // Direct connections can use prepared statements
  });
}

