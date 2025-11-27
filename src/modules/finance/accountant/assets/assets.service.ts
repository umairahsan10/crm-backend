import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Prisma, TransactionType, TransactionStatus, PaymentWays } from '@prisma/client';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import {
  AssetResponseDto,
  AssetListResponseDto,
  AssetCreateResponseDto,
  AssetUpdateResponseDto,
  AssetSingleResponseDto,
  AssetErrorResponseDto
} from './dto/asset-response.dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  // ==================== ASSET MANAGEMENT METHODS ====================

  /**
   * Creates a new asset with linked transaction
   */
  async createAsset(
    dto: CreateAssetDto,
    currentUserId: number
  ): Promise<AssetCreateResponseDto | AssetErrorResponseDto> {
    try {
      // Validate vendor exists
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: dto.vendorId },
      });
      if (!vendor) {
        return {
          status: 'error',
          message: 'Vendor not found',
          error_code: 'VENDOR_NOT_FOUND'
        };
      }

      // Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const currentDate = this.getCurrentDateInPKT();
        const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : currentDate;

        // 1. Create transaction record first
        // Get the next available ID (largest ID + 1)
        const maxTransactionId = await prisma.transaction.aggregate({
          _max: { id: true }
        });
        const nextTransactionId = (maxTransactionId._max.id || 0) + 1;

        const transaction = await prisma.transaction.create({
          data: {
            id: nextTransactionId, // Use explicit ID to avoid sequence conflicts
            employeeId: currentUserId,
            vendorId: dto.vendorId,
            amount: new Prisma.Decimal(dto.purchaseValue),
            transactionType: TransactionType.payment,
            paymentMethod: PaymentWays.cash,
            transactionDate: currentDate,
            status: TransactionStatus.completed, // Assets are always completed when created
            notes: `Asset: ${dto.title} - ${dto.category}`,
          },
        });

        // 2. Create asset record
        // Get the next available ID (largest ID + 1)
        const maxAssetId = await prisma.asset.aggregate({
          _max: { id: true }
        });
        const nextAssetId = (maxAssetId._max.id || 0) + 1;

        const asset = await prisma.asset.create({
          data: {
            id: nextAssetId, // Use explicit ID to avoid sequence conflicts
            title: dto.title,
            category: dto.category,
            purchaseDate: purchaseDate,
            purchaseValue: new Prisma.Decimal(dto.purchaseValue),
            currentValue: new Prisma.Decimal(dto.currentValue),
            transactionId: transaction.id,
            createdBy: currentUserId,
          },
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        return { asset, transaction };
      });

      this.logger.log(
        `Asset created: ${result.asset.id} by user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Asset created successfully',
        data: {
          asset: this.mapAssetToResponse(result.asset),
          transaction: this.mapTransactionToResponse(result.transaction),
        },
      };

    } catch (error) {
      this.logger.error(
        `Failed to create asset: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Gets all assets with optional filters
   */
  async getAllAssets(
    filters: {
      category?: string;
      fromDate?: string;
      toDate?: string;
      createdBy?: number;
      minPurchaseValue?: number;
      maxPurchaseValue?: number;
      minCurrentValue?: number;
      maxCurrentValue?: number;
    },
    query?: any
  ): Promise<AssetListResponseDto | AssetErrorResponseDto> {
    try {
      const whereClause: any = {};

      // Apply filters
      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      // Purchase date range filter
      if (filters.fromDate || filters.toDate) {
        whereClause.purchaseDate = {};
        if (filters.fromDate) {
          whereClause.purchaseDate.gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          whereClause.purchaseDate.lte = new Date(filters.toDate);
        }
      }

      // Purchase value range filter
      if (filters.minPurchaseValue || filters.maxPurchaseValue) {
        whereClause.purchaseValue = {};
        if (filters.minPurchaseValue) {
          whereClause.purchaseValue.gte = new Prisma.Decimal(filters.minPurchaseValue);
        }
        if (filters.maxPurchaseValue) {
          whereClause.purchaseValue.lte = new Prisma.Decimal(filters.maxPurchaseValue);
        }
      }

      // Current value range filter
      if (filters.minCurrentValue || filters.maxCurrentValue) {
        whereClause.currentValue = {};
        if (filters.minCurrentValue) {
          whereClause.currentValue.gte = new Prisma.Decimal(filters.minCurrentValue);
        }
        if (filters.maxCurrentValue) {
          whereClause.currentValue.lte = new Prisma.Decimal(filters.maxCurrentValue);
        }
      }

      // Search support
      if (query?.search) {
        whereClause.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
          { transaction: { vendor: { name: { contains: query.search, mode: 'insensitive' } } } }
        ];
      }

      // Pagination parameters
      const page = parseInt(query?.page) || 1;
      const limit = parseInt(query?.limit) || 20;
      const skip = (page - 1) * limit;

      const [assets, total] = await Promise.all([
        this.prisma.asset.findMany({
          where: whereClause,
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.asset.count({ where: whereClause })
      ]);

      return {
        status: 'success',
        message: 'Assets retrieved successfully',
        data: assets.map(asset => this.mapAssetToResponse(asset)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          retrieved: assets.length
        }
      };

    } catch (error) {
      this.logger.error(
        `Failed to get assets: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Gets a single asset by ID
   */
  async getAssetById(id: number): Promise<AssetSingleResponseDto | AssetErrorResponseDto> {
    try {
      const asset = await this.prisma.asset.findUnique({
        where: { id },
        include: {
          transaction: {
            include: {
              vendor: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!asset) {
        return {
          status: 'error',
          message: 'Asset not found',
          error_code: 'ASSET_NOT_FOUND'
        };
      }

      return {
        status: 'success',
        message: 'Asset retrieved successfully',
        data: this.mapAssetToResponse(asset),
      };

    } catch (error) {
      this.logger.error(
        `Failed to get asset ${id}: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Updates an asset
   */
  async updateAsset(
    dto: UpdateAssetDto,
    currentUserId: number
  ): Promise<AssetUpdateResponseDto | AssetErrorResponseDto> {
    const { asset_id, ...updateData } = dto;
    
    // Validate that ID exists
    if (!asset_id) {
      return {
        status: 'error',
        message: 'Asset ID is required',
        error_code: 'MISSING_ASSET_ID'
      };
    }
    
    try {
      // 1. Check if asset exists
      const existingAsset = await this.prisma.asset.findUnique({
        where: { id: asset_id },
        include: {
          transaction: true,
        },
      });

      if (!existingAsset) {
        return {
          status: 'error',
          message: 'Asset not found',
          error_code: 'ASSET_NOT_FOUND'
        };
      }

      // 2. Validate vendor if provided
      if (updateData.vendorId) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: updateData.vendorId },
        });
        if (!vendor) {
          return {
            status: 'error',
            message: 'Vendor not found',
            error_code: 'VENDOR_NOT_FOUND'
          };
        }
      }

      // 3. Use Prisma transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        const assetUpdateData: any = {
          updatedAt: this.getCurrentDateInPKT(),
        };

        // Update asset fields
        if (updateData.title !== undefined) assetUpdateData.title = updateData.title;
        if (updateData.category !== undefined) assetUpdateData.category = updateData.category;
        if (updateData.purchaseDate !== undefined) assetUpdateData.purchaseDate = new Date(updateData.purchaseDate);
        if (updateData.purchaseValue !== undefined) assetUpdateData.purchaseValue = new Prisma.Decimal(updateData.purchaseValue);
        if (updateData.currentValue !== undefined) assetUpdateData.currentValue = new Prisma.Decimal(updateData.currentValue);

        // Update asset
        const updatedAsset = await prisma.asset.update({
          where: { id: asset_id },
          data: assetUpdateData,
          include: {
            transaction: {
              include: {
                vendor: true,
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Update transaction if purchaseValue changed
        let updatedTransaction: any = null;
        if (updateData.purchaseValue !== undefined && updateData.purchaseValue !== Number(existingAsset.purchaseValue)) {
          updatedTransaction = await prisma.transaction.update({
            where: { id: existingAsset.transactionId },
            data: {
              amount: new Prisma.Decimal(updateData.purchaseValue),
              notes: `Asset: ${updatedAsset.title} - ${updatedAsset.category} (Updated)`,
              updatedAt: this.getCurrentDateInPKT(),
            },
          });
        }

        // Update transaction vendor if vendorId changed
        if (updateData.vendorId !== undefined && updateData.vendorId !== existingAsset.transaction.vendorId) {
          updatedTransaction = await prisma.transaction.update({
            where: { id: existingAsset.transactionId },
            data: {
              vendorId: updateData.vendorId,
              notes: `Asset: ${updatedAsset.title} - ${updatedAsset.category} (Updated)`,
              updatedAt: this.getCurrentDateInPKT(),
            },
          });
        }

        return { asset: updatedAsset, transaction: updatedTransaction };
      });

      this.logger.log(
        `Asset updated: ${asset_id} by user ${currentUserId}`,
      );

      return {
        status: 'success',
        message: 'Asset updated successfully',
        data: {
          asset: this.mapAssetToResponse(result.asset),
          transaction: result.transaction ? this.mapTransactionToResponse(result.transaction) : undefined,
        },
      };

    } catch (error) {
      this.logger.error(
        `Failed to update asset ${asset_id}: ${error.message}`,
      );

      return {
        status: 'error',
        message: this.getErrorMessage(error.message),
        error_code: error.message,
      };
    }
  }

  /**
   * Maps asset data to response DTO
   */
  private mapAssetToResponse(asset: any): AssetResponseDto {
    return {
      id: asset.id,
      title: asset.title,
      category: asset.category,
      purchaseDate: asset.purchaseDate,
      purchaseValue: Number(asset.purchaseValue),
      currentValue: Number(asset.currentValue),
      transactionId: asset.transactionId,
      vendorId: asset.transaction.vendorId,
      createdBy: asset.createdBy,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      transaction: this.mapTransactionToResponse(asset.transaction),
      vendor: this.mapVendorToResponse(asset.transaction.vendor),
      employee: asset.employee,
    };
  }

  /**
   * Maps vendor data to response DTO
   */
  private mapVendorToResponse(vendor: any): any {
    return {
      id: vendor.id,
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city,
      country: vendor.country,
      bankAccount: vendor.bankAccount,
      status: vendor.status,
      notes: vendor.notes,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  /**
   * Maps transaction data to response DTO
   */
  private mapTransactionToResponse(transaction: any): any {
    return {
      id: transaction.id,
      employeeId: transaction.employeeId,
      vendorId: transaction.vendorId,
      clientId: transaction.clientId,
      invoiceId: transaction.invoiceId,
      amount: Number(transaction.amount),
      transactionType: transaction.transactionType,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate,
      status: transaction.status,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Helper method to get error message
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'P2002':
        return 'A record with this ID already exists';
      case 'P2003':
        return 'Foreign key constraint failed';
      case 'P2025':
        return 'Record not found';
      default:
        return 'An error occurred while processing the request';
    }
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<any> {
    try {
      const currentDate = this.getCurrentDateInPKT();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Get all assets
      const allAssets = await this.prisma.asset.findMany({});

      // Total count
      const totalAssets = allAssets.length;

      // Total purchase value and current value
      const totalPurchaseValue = allAssets.reduce((sum, asset) => sum + Number(asset.purchaseValue), 0);
      const totalCurrentValue = allAssets.reduce((sum, asset) => sum + Number(asset.currentValue), 0);

      // Total depreciation
      const totalDepreciation = totalPurchaseValue - totalCurrentValue;

      // Average depreciation rate
      const averageDepreciationRate = totalPurchaseValue > 0 
        ? ((totalDepreciation / totalPurchaseValue) * 100) 
        : 0;

      // Breakdown by category
      const categoryBreakdown: Record<string, { count: number; totalPurchaseValue: number; totalCurrentValue: number }> = {};
      allAssets.forEach((asset) => {
        const category = asset.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { count: 0, totalPurchaseValue: 0, totalCurrentValue: 0 };
        }
        categoryBreakdown[category].count++;
        categoryBreakdown[category].totalPurchaseValue += Number(asset.purchaseValue);
        categoryBreakdown[category].totalCurrentValue += Number(asset.currentValue);
      });

      // This month's stats
      const thisMonthAssets = allAssets.filter(
        (asset) => asset.createdAt >= firstDayOfMonth
      );
      const thisMonthCount = thisMonthAssets.length;
      const thisMonthValue = thisMonthAssets.reduce((sum, asset) => sum + Number(asset.purchaseValue), 0);

      // Assets with significant depreciation (more than 50% depreciation)
      const assetsNeedingAttention = allAssets
        .filter((asset) => {
          const depreciationRate = Number(asset.purchaseValue) > 0 
            ? ((Number(asset.purchaseValue) - Number(asset.currentValue)) / Number(asset.purchaseValue)) * 100
            : 0;
          return depreciationRate > 50;
        })
        .map((asset) => ({
          id: asset.id,
          title: asset.title,
          category: asset.category,
          purchaseValue: Number(asset.purchaseValue),
          currentValue: Number(asset.currentValue),
          depreciationRate: Math.round(((Number(asset.purchaseValue) - Number(asset.currentValue)) / Number(asset.purchaseValue)) * 100 * 100) / 100,
        }))
        .slice(0, 5);

      return {
        status: 'success',
        message: 'Asset statistics retrieved successfully',
        data: {
          totalAssets,
          totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
          totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
          totalDepreciation: Math.round(totalDepreciation * 100) / 100,
          averageDepreciationRate: Math.round(averageDepreciationRate * 100) / 100,
          byCategory: categoryBreakdown,
          thisMonth: {
            count: thisMonthCount,
            totalValue: Math.round(thisMonthValue * 100) / 100,
          },
          assetsNeedingAttention,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving asset statistics: ${error.message}`);
      return {
        status: 'error',
        message: 'An error occurred while retrieving asset statistics',
        error_code: error.message,
      };
    }
  }
}