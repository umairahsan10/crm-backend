import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { MarketingService } from '../services/marketing.service';
import { CreateMarketingDto, UpdateMarketingDto } from '../dto/marketing.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  MarketingRecordResponseDto,
  MarketingRecordsListResponseDto,
} from '../dto/marketing-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('hr/marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Get all marketing records' })
  @ApiResponse({
    status: 200,
    description: 'List of marketing records',
    type: MarketingRecordsListResponseDto,
  })
  async getAllMarketingRecords(@Request() req: AuthenticatedRequest) {
    return await this.marketingService.getAllMarketingRecords();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Get a marketing record by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Marketing record ID' })
  @ApiResponse({
    status: 200,
    description: 'Marketing record details',
    type: MarketingRecordResponseDto,
  })
  async getMarketingRecordById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.marketingService.getMarketingRecordById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Create a new marketing record' })
  @ApiResponse({
    status: 201,
    description: 'Marketing record created',
    type: MarketingRecordResponseDto,
  })
  async createMarketingRecord(
    @Body() dto: CreateMarketingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.marketingService.createMarketingRecord(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Update a marketing record' })
  @ApiParam({ name: 'id', type: Number, description: 'Marketing record ID' })
  @ApiResponse({
    status: 200,
    description: 'Marketing record updated',
    type: MarketingRecordResponseDto,
  })
  async updateMarketingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.marketingService.updateMarketingRecord(
      id,
      dto,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('HR')
  @Permissions(PermissionName.employee_add_permission)
  @ApiOperation({ summary: 'Delete a marketing record' })
  @ApiParam({ name: 'id', type: Number, description: 'Marketing record ID' })
  @ApiResponse({ status: 200, description: 'Marketing record deleted' })
  async deleteMarketingRecord(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return await this.marketingService.deleteMarketingRecord(id, req.user.id);
  }
}
