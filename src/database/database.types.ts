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
  connected: boolean;
  error?: string;
  latency?: number;
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
