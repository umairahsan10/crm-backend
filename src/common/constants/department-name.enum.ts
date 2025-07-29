import { PrismaClient } from '@prisma/client';

let cachedDepartmentNames: string[] | null = null;

/**
 * Fetches all department names from the database once and caches them for
 * subsequent calls to avoid exhausting the connection pool.
 */
export async function getDepartmentNames(): Promise<string[]> {
  if (cachedDepartmentNames) {
    return cachedDepartmentNames;
  }

  const prisma = new PrismaClient();
  try {
    const departments = await prisma.department.findMany({ select: { name: true } });
    cachedDepartmentNames = departments.map((d) => d.name);
    return cachedDepartmentNames;
  } finally {
    await prisma.$disconnect();
  }
}

export type DepartmentName = string; 