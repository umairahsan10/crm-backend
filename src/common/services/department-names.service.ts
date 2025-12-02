import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Department Names Service
 *
 * Provides cached access to department names from the database.
 * Implements proper dependency injection and caching to avoid repeated
 * database queries and connection pool exhaustion.
 *
 * This service replaces the global variable pattern used in
 * department-name.enum.ts with a proper NestJS service pattern.
 */
@Injectable()
export class DepartmentNamesService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentNamesService.name);
  private cachedDepartmentNames: string[] | null = null;
  private cacheInitialized = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize cache on module init (optional - lazy loading is also supported)
   */
  async onModuleInit() {
    // Optionally pre-load cache on startup
    // Uncomment if you want to eagerly load department names
    // await this.refreshCache();
  }

  /**
   * Get all department names from the database
   *
   * Uses caching to avoid repeated database queries. The cache is populated
   * on first access and can be refreshed using refreshCache().
   *
   * @returns Promise<string[]> Array of department names
   *
   * @example
   * ```typescript
   * const names = await this.deptService.getDepartmentNames();
   * ```
   */
  async getDepartmentNames(): Promise<string[]> {
    // Return cached value if available
    if (this.cachedDepartmentNames !== null) {
      return this.cachedDepartmentNames;
    }

    // Load from database if cache is empty
    try {
      this.logger.debug('Loading department names from database...');
      const departments = await this.prisma.department.findMany({
        select: { name: true },
      });

      this.cachedDepartmentNames = departments.map((d) => d.name);
      this.cacheInitialized = true;
      this.logger.debug(
        `Loaded ${this.cachedDepartmentNames.length} department names`,
      );

      return this.cachedDepartmentNames;
    } catch (error) {
      this.logger.error('Failed to fetch department names:', error);
      // Return empty array as fallback to prevent app crashes
      return [];
    }
  }

  /**
   * Clear the department names cache
   *
   * Forces the next call to getDepartmentNames() to reload from the database.
   * Useful when department data changes and cache needs to be invalidated.
   *
   * @example
   * ```typescript
   * // After creating/updating/deleting a department
   * await this.deptService.clearCache();
   * ```
   */
  clearCache(): void {
    this.logger.debug('Clearing department names cache');
    this.cachedDepartmentNames = null;
    this.cacheInitialized = false;
  }

  /**
   * Refresh the department names cache
   *
   * Immediately reloads department names from the database and updates the cache.
   * This is useful when you know the data has changed and want to update the cache
   * proactively rather than waiting for the next getDepartmentNames() call.
   *
   * @returns Promise<string[]> Array of department names
   *
   * @example
   * ```typescript
   * // After creating/updating/deleting a department
   * const updatedNames = await this.deptService.refreshCache();
   * ```
   */
  async refreshCache(): Promise<string[]> {
    this.logger.debug('Refreshing department names cache');
    this.clearCache();
    return await this.getDepartmentNames();
  }

  /**
   * Check if the cache has been initialized
   *
   * @returns boolean True if cache has been populated at least once
   */
  isCacheInitialized(): boolean {
    return this.cacheInitialized;
  }

  /**
   * Get the current cached department names without triggering a database query
   *
   * Returns null if cache has not been initialized yet.
   *
   * @returns string[] | null Cached department names or null if not cached
   */
  getCachedDepartmentNames(): string[] | null {
    return this.cachedDepartmentNames;
  }
}
