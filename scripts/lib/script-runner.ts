#!/usr/bin/env ts-node

/**
 * Script Runner Utility
 * 
 * Provides a unified way for scripts to access the singleton PrismaService
 * through NestJS application context. This ensures scripts use the same
 * connection pool and configuration as the main application.
 * 
 * Usage:
 * ```typescript
 * import { runScriptWithPrisma } from './lib/script-runner';
 * 
 * runScriptWithPrisma(async (prisma) => {
 *   const employees = await prisma.employee.findMany();
 *   console.log(`Found ${employees.length} employees`);
 * })
 *   .then(() => process.exit(0))
 *   .catch((error) => {
 *     console.error('Script failed:', error);
 *     process.exit(1);
 *   });
 * ```
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration options for script execution
 */
export interface ScriptRunnerConfig {
  /**
   * Timeout in milliseconds for script execution
   * Default: 300000 (5 minutes)
   */
  timeout?: number;
  
  /**
   * Whether to enable verbose logging
   * Default: false
   */
  verbose?: boolean;
  
  /**
   * Whether to enable shutdown hooks (graceful shutdown)
   * Default: true
   */
  enableShutdownHooks?: boolean;
}

/**
 * Type for script functions that receive PrismaService
 */
export type ScriptFunction = (prisma: PrismaService) => Promise<void>;

/**
 * Runs a script function with access to the singleton PrismaService
 * 
 * This function:
 * 1. Creates a NestJS application context
 * 2. Gets the PrismaService from the context
 * 3. Executes the provided script function
 * 4. Handles cleanup and errors gracefully
 * 
 * @param scriptFn - The script function to execute
 * @param config - Optional configuration for script execution
 * @returns Promise that resolves when script completes
 * 
 * @example
 * ```typescript
 * runScriptWithPrisma(async (prisma) => {
 *   const employees = await prisma.employee.findMany();
 *   console.log(`Found ${employees.length} employees`);
 * })
 *   .then(() => process.exit(0))
 *   .catch((error) => {
 *     console.error('Script failed:', error);
 *     process.exit(1);
 *   });
 * ```
 */
export async function runScriptWithPrisma(
  scriptFn: ScriptFunction,
  config: ScriptRunnerConfig = {},
): Promise<void> {
  const {
    timeout = 300000, // 5 minutes default
    verbose = false,
    enableShutdownHooks = true,
  } = config;

  const logger = new Logger('ScriptRunner');
  let app: any = null;

  try {
    if (verbose) {
      logger.log('🚀 Starting script execution...');
      logger.log(`⏱️  Timeout: ${timeout}ms`);
    }

    // Create NestJS application context
    if (verbose) {
      logger.log('📦 Creating NestJS application context...');
    }
    
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: verbose ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn'],
    });

    // Get PrismaService from context
    if (verbose) {
      logger.log('🔌 Getting PrismaService from application context...');
    }
    
    const prisma = app.get(PrismaService);

    // Ensure connection is healthy
    if (verbose) {
      logger.log('🏥 Checking database connection health...');
    }
    
    const isHealthy = await prisma.isConnectionHealthy();
    if (!isHealthy) {
      logger.warn('⚠️  Database connection is not healthy, attempting to reconnect...');
      await prisma.reconnectIfNeeded();
    }

    if (verbose) {
      logger.log('✅ Database connection ready');
    }

    // Enable shutdown hooks if requested
    if (enableShutdownHooks) {
      if (verbose) {
        logger.log('🪝 Enabling graceful shutdown hooks...');
      }
      await prisma.enableShutdownHooks(app);
    }

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }, timeout);
    });

    // Execute script with timeout
    if (verbose) {
      logger.log('▶️  Executing script function...');
    }
    
    await Promise.race([
      scriptFn(prisma),
      timeoutPromise,
    ]);

    if (verbose) {
      logger.log('✅ Script execution completed successfully');
    }
  } catch (error) {
    logger.error('❌ Script execution failed:', error.message);
    if (verbose && error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    throw error;
  } finally {
    // Cleanup: Close application context
    if (app) {
      if (verbose) {
        logger.log('🧹 Cleaning up application context...');
      }
      try {
        await app.close();
        if (verbose) {
          logger.log('✅ Application context closed');
        }
      } catch (error) {
        logger.warn('⚠️  Error closing application context:', error.message);
      }
    }
  }
}

/**
 * Convenience function for running scripts that need multiple services
 * 
 * This function allows scripts to access multiple services from the NestJS context.
 * 
 * @param scriptFn - Function that receives an object with services
 * @param config - Optional configuration for script execution
 * @returns Promise that resolves when script completes
 * 
 * @example
 * ```typescript
 * runScriptWithServices(async ({ prisma, deptService }) => {
 *   const names = await deptService.getDepartmentNames();
 *   console.log('Departments:', names);
 * });
 * ```
 */
export async function runScriptWithServices<T extends Record<string, any>>(
  scriptFn: (services: T) => Promise<void>,
  services: (app: any) => T,
  config: ScriptRunnerConfig = {},
): Promise<void> {
  const {
    timeout = 300000,
    verbose = false,
    enableShutdownHooks = true,
  } = config;

  const logger = new Logger('ScriptRunner');
  let app: any = null;

  try {
    if (verbose) {
      logger.log('🚀 Starting script execution with multiple services...');
    }

    app = await NestFactory.createApplicationContext(AppModule, {
      logger: verbose ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn'],
    });

    // Get services from context
    const serviceInstances = services(app);

    // Enable shutdown hooks if PrismaService is available
    if (enableShutdownHooks && 'prisma' in serviceInstances) {
      const prisma = serviceInstances.prisma as PrismaService;
      if (prisma && typeof prisma.enableShutdownHooks === 'function') {
        await prisma.enableShutdownHooks(app);
      }
    }

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }, timeout);
    });

    // Execute script with timeout
    await Promise.race([
      scriptFn(serviceInstances),
      timeoutPromise,
    ]);

    if (verbose) {
      logger.log('✅ Script execution completed successfully');
    }
  } catch (error) {
    logger.error('❌ Script execution failed:', error.message);
    if (verbose && error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    throw error;
  } finally {
    if (app) {
      try {
        await app.close();
      } catch (error) {
        logger.warn('⚠️  Error closing application context:', error.message);
      }
    }
  }
}

