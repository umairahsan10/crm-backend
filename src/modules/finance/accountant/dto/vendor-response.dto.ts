export class VendorResponseDto {
  status: 'success' | 'error';
  message: string;
  vendor_id?: number;
  vendor_data?: {
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
  };
  error_code?: string;
} 