import { CampaignLog, CampaignStatus } from '@prisma/client';

export class CampaignResponseDto {
  id: number;
  campaignName: string;
  campaignType: string;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  budget: number;
  actualCost?: number;
  unitId: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  productionUnitId?: number;
  marketingUnit?: {
    id: number;
    name: string;
  };
  productionUnit?: {
    id: number;
    name: string;
  };
}

export class CampaignListResponseDto {
  campaigns: CampaignResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
