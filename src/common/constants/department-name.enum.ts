import { PrismaService } from '../../../prisma/prisma.service';

let cachedDepartmentNames: string[] | null = null;
let prismaService: PrismaService | null = null;

/**
 * Sets the PrismaService instance for dependency injection
 * This should be called during app initialization
 */
export function setPrismaService(prisma: PrismaService): void {
  prismaService = prisma;
}

/**
 * Fetches all department names from the database once and caches them for
 * subsequent calls to avoid exhausting the connection pool.
 * Uses the singleton PrismaService instance instead of creating new connections.
 */
export async function getDepartmentNames(): Promise<string[]> {
  if (cachedDepartmentNames) {
    return cachedDepartmentNames;
  }

  if (!prismaService) {
    throw new Error('PrismaService not initialized. Call setPrismaService() first.');
  }

  try {
    const departments = await prismaService.department.findMany({ select: { name: true } });
    cachedDepartmentNames = departments.map((d) => d.name);
    return cachedDepartmentNames;
  } catch (error) {
    console.error('Failed to fetch department names:', error);
    // Return empty array as fallback to prevent app crashes
    return [];
  }
}

export type DepartmentName = string; 