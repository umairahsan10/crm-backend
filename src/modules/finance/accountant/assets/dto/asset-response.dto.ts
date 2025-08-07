export class TransactionResponseDto {
    id: number;
    amount: number;
    transactionType: string;
    paymentMethod: string;
    transactionDate: string;
    status: string;
    notes: string;
    employeeId: number;
    vendorId: number;
    clientId: number | null;
    invoiceId: number | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export class VendorResponseDto {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    bankAccount: string;
    status: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export class AssetResponseDto {
    id: number;
    title: string;
    category: string;
    purchaseDate: string;
    purchaseValue: number;
    currentValue: number;
    transactionId: number;
    vendorId: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    transaction: TransactionResponseDto;
    vendor: VendorResponseDto;
    employee: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }
  
  export class AssetListResponseDto {
    status: string;
    message: string;
    data: AssetResponseDto[];
    total: number;
  }
  
  export class AssetCreateResponseDto {
    status: string;
    message: string;
    data: {
      asset: AssetResponseDto;
      transaction: TransactionResponseDto;
    };
  }
  
  export class AssetUpdateResponseDto {
    status: string;
    message: string;
    data: {
      asset: AssetResponseDto;
      transaction?: TransactionResponseDto;
    };
  }
  
  export class AssetSingleResponseDto {
  status: string;
  message: string;
  data: AssetResponseDto;
}

export class ErrorResponseDto {
  status: string;
  message: string;
  error_code: string;
} 