/**
 * Database Types and Interfaces
 *
 * Type definitions for database configuration, connection testing,
 * and migration operations.
 */

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  runtime: {
    connected: boolean;
    error?: string;
    latency?: number;
  };
  migration: {
    connected: boolean;
    error?: string;
    latency?: number;
  };
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  mode: 'dev' | 'deploy' | 'reset' | 'push';
  name?: string;
  force?: boolean;
  directUrl: string;
  skipGenerators?: boolean;
  createOnly?: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  message: string;
  migrationName?: string;
  error?: string;
}

/**
 * Pool statistics
 */
export interface PoolStatistics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  waitingRequests: number;
}

/**
 * Connection health status
 */
export interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  runtime: boolean;
  migration: boolean;
  lastCheck: Date;
  errors: string[];
}
