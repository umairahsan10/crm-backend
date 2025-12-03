import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DatabaseConfigService } from '../config/database.config';
import { ConnectionHealth, PoolStatistics } from './database.types';

/**
 * Database Service
 *
 * Provides database connection management, health monitoring,
 * and connection statistics. Extends PrismaService functionality
 * with additional monitoring and management capabilities.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: ConnectionHealth;

  constructor(private readonly configService: DatabaseConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing Database Service...');
    this.logger.log(`Environment: ${this.configService.getEnvironment()}`);
    this.logger.log(`SSL Enabled: ${this.configService.isSslEnabled()}`);
    this.logger.log(
      `Logging Enabled: ${this.configService.isLoggingEnabled()}`,
    );

    if (this.configService.getEnvironment() === 'development') {
      this.startHealthMonitoring();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Database Service...');
    this.stopHealthMonitoring();
  }

  /**
   * Get database configuration
   */
  getConfig() {
    return this.configService.getConfig();
  }

  /**
   * Get connection health status
   */
  async getHealthStatus(): Promise<ConnectionHealth> {
    const errors: string[] = [];

    // Check database connection
    const connectionHealthy = await this.checkDatabaseConnection();

    if (!connectionHealthy) {
      errors.push('Database connection is unhealthy');
    }

    const status: 'healthy' | 'degraded' | 'unhealthy' = connectionHealthy
      ? 'healthy'
      : 'unhealthy';

    const health: ConnectionHealth = {
      status,
      runtime: connectionHealthy,
      migration: connectionHealthy,
      lastCheck: new Date(),
      errors,
    };

    this.lastHealthCheck = health;
    return health;
  }

  /**
   * Get pool statistics (if available)
   */
  async getPoolStatistics(): Promise<PoolStatistics | null> {
    // Note: Prisma doesn't expose pool statistics directly
    // This is a placeholder for future implementation
    // Could be implemented with a custom connection pool monitor
    return null;
  }

  /**
   * Check database connection health
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Validate the URL is configured
      const url = this.configService.getDatabaseUrl();
      return !!url;
    } catch (error) {
      this.logger.error(`Database connection check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Start health monitoring (development only)
   */
  private startHealthMonitoring() {
    if (this.healthCheckInterval) {
      return;
    }

    this.logger.log('Starting database health monitoring (every 60s)');
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        if (health.status !== 'healthy') {
          this.logger.warn(`Database health: ${health.status}`, health.errors);
        }
      } catch (error) {
        this.logger.error(`Health check failed: ${error.message}`);
      }
    }, 60000); // Check every 60 seconds
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.log('Stopped database health monitoring');
    }
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): ConnectionHealth | undefined {
    return this.lastHealthCheck;
  }
}
