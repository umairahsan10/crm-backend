export class VendorListResponseDto {
  status: 'success' | 'error';
  message: string;
  vendors?: {
    id: number;
    name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    bank_account?: string;
    status?: string;
    created_by?: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
  }[];
  metadata?: {
    total_count: number;
    page?: number;
    limit?: number;
    total_pages?: number;
  };
  error_code?: string;
} 