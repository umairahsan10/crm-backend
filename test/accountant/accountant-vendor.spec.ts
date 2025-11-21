import { Test, TestingModule } from '@nestjs/testing';
import { AccountantController } from '../../src/modules/finance/accountant/accountant.controller';
import { AccountantService } from '../../src/modules/finance/accountant/accountant.service';
import { AddVendorDto } from '../../src/modules/finance/accountant/dto/add-vendor.dto';
import { VendorResponseDto } from '../../src/modules/finance/accountant/dto/vendor-response.dto';
import { VendorListResponseDto } from '../../src/modules/finance/accountant/dto/vendor-list-response.dto';

describe('AccountantController - Vendor Operations', () => {
  let controller: AccountantController;
  let service: AccountantService;

  const mockAccountantService = {
    addVendor: jest.fn(),
    getAllVendors: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountantController],
      providers: [
        {
          provide: AccountantService,
          useValue: mockAccountantService,
        },
      ],
    }).compile();

    controller = module.get<AccountantController>(AccountantController);
    service = module.get<AccountantService>(AccountantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addVendor', () => {
    it('should create a vendor successfully', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Accounts' },
      };

      const addVendorDto: AddVendorDto = {
        name: 'Test Vendor',
        contact_person: 'John Doe',
        email: 'john@testvendor.com',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        bank_account: '1234567890',
        status: 'active',
        notes: 'Test vendor for testing purposes',
      };

      const expectedResponse: VendorResponseDto = {
        status: 'success',
        message: 'Vendor created successfully',
        vendor_id: 1,
        vendor_data: {
          id: 1,
          name: 'Test Vendor',
          contact_person: 'John Doe',
          email: 'john@testvendor.com',
          phone: '+1234567890',
          address: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          bank_account: '1234567890',
          status: 'active',
          created_by: 1,
          notes: 'Test vendor for testing purposes',
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      mockAccountantService.addVendor.mockResolvedValue(expectedResponse);

      const result = await controller.addVendor(addVendorDto, mockRequest as any);

      expect(service.addVendor).toHaveBeenCalledWith(addVendorDto, 1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when user is not an accountant', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Accounts' },
      };

      const addVendorDto: AddVendorDto = {
        name: 'Test Vendor',
      };

      const expectedResponse: VendorResponseDto = {
        status: 'error',
        message: 'Only accountants can add vendors',
        error_code: 'NOT_ACCOUNTANT',
      };

      mockAccountantService.addVendor.mockResolvedValue(expectedResponse);

      const result = await controller.addVendor(addVendorDto, mockRequest as any);

      expect(service.addVendor).toHaveBeenCalledWith(addVendorDto, 1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when user is not in Accounts department', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Sales' },
      };

      const addVendorDto: AddVendorDto = {
        name: 'Test Vendor',
      };

      const expectedResponse: VendorResponseDto = {
        status: 'error',
        message: 'Only Accounts department members can add vendors',
        error_code: 'NOT_ACCOUNTS_DEPARTMENT',
      };

      mockAccountantService.addVendor.mockResolvedValue(expectedResponse);

      const result = await controller.addVendor(addVendorDto, mockRequest as any);

      expect(service.addVendor).toHaveBeenCalledWith(addVendorDto, 1);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAllVendors', () => {
    it('should retrieve all vendors successfully', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Accounts' },
      };

      const mockVendors = [
        {
          id: 1,
          name: 'Test Vendor 1',
          contact_person: 'John Doe',
          email: 'john@testvendor1.com',
          phone: '+1234567890',
          address: '123 Test Street',
          city: 'Test City',
          country: 'Test Country',
          bank_account: '1234567890',
          status: 'active',
          created_by: 1,
          notes: 'Test vendor 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Test Vendor 2',
          contact_person: 'Jane Smith',
          email: 'jane@testvendor2.com',
          phone: '+0987654321',
          address: '456 Test Avenue',
          city: 'Test City 2',
          country: 'Test Country 2',
          bank_account: '0987654321',
          status: 'active',
          created_by: 1,
          notes: 'Test vendor 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const expectedResponse: VendorListResponseDto = {
        status: 'success',
        message: 'Successfully retrieved 2 vendor records.',
        vendors: mockVendors,
        metadata: {
          total_count: 2,
        },
      };

      mockAccountantService.getAllVendors.mockResolvedValue(expectedResponse);

      const result = await controller.getAllVendors(mockRequest as any);

      expect(service.getAllVendors).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when user is not an accountant', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Accounts' },
      };

      const expectedResponse: VendorListResponseDto = {
        status: 'error',
        message: 'Access denied: You (John Doe) are not authorized as an accountant. Only accountants can view vendor records. Please contact your department manager to request accountant privileges.',
        error_code: 'NOT_ACCOUNTANT',
      };

      mockAccountantService.getAllVendors.mockResolvedValue(expectedResponse);

      const result = await controller.getAllVendors(mockRequest as any);

      expect(service.getAllVendors).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return error when user is not in Accounts department', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Sales' },
      };

      const expectedResponse: VendorListResponseDto = {
        status: 'error',
        message: 'Permission denied: You (John Doe) are in the Sales department. Only members of the Accounts department can view vendor records.',
        error_code: 'NOT_ACCOUNTS_DEPARTMENT',
      };

      mockAccountantService.getAllVendors.mockResolvedValue(expectedResponse);

      const result = await controller.getAllVendors(mockRequest as any);

      expect(service.getAllVendors).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty vendor list', async () => {
      const mockRequest = {
        user: { id: 1, type: 'employee', department: 'Accounts' },
      };

      const expectedResponse: VendorListResponseDto = {
        status: 'success',
        message: 'Successfully retrieved 0 vendor records.',
        vendors: [],
        metadata: {
          total_count: 0,
        },
      };

      mockAccountantService.getAllVendors.mockResolvedValue(expectedResponse);

      const result = await controller.getAllVendors(mockRequest as any);

      expect(service.getAllVendors).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });
  });
}); 