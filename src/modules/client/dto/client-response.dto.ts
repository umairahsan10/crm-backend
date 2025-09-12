import { accStat } from '@prisma/client';

export class ClientResponseDto {
  id: number;
  clientType?: string;
  companyName?: string;
  clientName?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  industryId?: number;
  taxId?: string;
  accountStatus: accStat;
  createdBy?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  industry?: {
    id: number;
    name: string;
    description?: string;
  };
  
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class ClientListResponseDto {
  clients: ClientResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
