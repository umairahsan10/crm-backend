import { SetMetadata } from '@nestjs/common';

export const DEPARTMENTS_KEY = 'departments';
export const Departments = (...departments: string[]) =>
  SetMetadata(DEPARTMENTS_KEY, departments); 