#!/usr/bin/env ts-node

/**
 * Example Script Using Script Runner
 * 
 * This script demonstrates how to use the script-runner utility to access
 * the singleton PrismaService through NestJS application context.
 * 
 * Usage:
 *   npx ts-node scripts/example-script.ts
 * 
 * This script:
 * - Uses the singleton PrismaService (same as the application)
 * - Automatically handles connection management
 * - Provides graceful error handling
 * - Supports timeout configuration
 */

import { runScriptWithPrisma, runScriptWithServices } from './lib/script-runner';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentNamesService } from '../src/common/services/department-names.service';

/**
 * Example 1: Simple script with PrismaService only
 */
async function example1() {
  console.log('\n📋 Example 1: Simple Prisma Query\n');
  
  await runScriptWithPrisma(
    async (prisma: PrismaService) => {
      // Use PrismaService just like in any service
      const employeeCount = await prisma.employee.count();
      const departmentCount = await prisma.department.count();
      
      console.log(`✅ Found ${employeeCount} employees`);
      console.log(`✅ Found ${departmentCount} departments`);
    },
    {
      verbose: true, // Enable detailed logging
      timeout: 60000, // 1 minute timeout
    },
  );
}

/**
 * Example 2: Script with multiple services
 */
async function example2() {
  console.log('\n📋 Example 2: Using Multiple Services\n');
  
  await runScriptWithServices(
    async ({ prisma, deptService }) => {
      // Get department names using the service
      const departmentNames = await deptService.getDepartmentNames();
      console.log(`✅ Department names (from service): ${departmentNames.join(', ')}`);
      
      // Also use Prisma directly if needed
      const departments = await prisma.department.findMany({
        select: { name: true, id: true },
      });
      console.log(`✅ Total departments: ${departments.length}`);
    },
    (app) => ({
      prisma: app.get(PrismaService),
      deptService: app.get(DepartmentNamesService),
    }),
    {
      verbose: true,
    },
  );
}

/**
 * Example 3: Script with error handling
 */
async function example3() {
  console.log('\n📋 Example 3: Error Handling\n');
  
  try {
    await runScriptWithPrisma(async (prisma) => {
      // This will fail if the table doesn't exist
      const result = await prisma.$queryRaw`SELECT COUNT(*) FROM non_existent_table`;
      console.log('Result:', result);
    });
  } catch (error) {
    console.error('❌ Script failed as expected:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Script Runner Examples');
  console.log('========================\n');
  
  try {
    // Run examples sequentially
    await example1();
    await example2();
    await example3();
    
    console.log('\n✅ All examples completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Example script failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

