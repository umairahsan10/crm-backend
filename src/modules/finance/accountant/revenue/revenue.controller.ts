import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { 
  RevenueCreateResponseDto,
  RevenueUpdateResponseDto,
  RevenueListResponseDto,
  RevenueSingleResponseDto
} from './dto/revenue-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Accountant Revenue')
@ApiBearerAuth()
@Controller('accountant/revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Create a new revenue record' })
  @ApiResponse({ status: 201, description: 'Revenue created successfully', type: RevenueCreateResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or lead/invoice mismatch' })
  async createRevenue(
    @Body() dto: CreateRevenueDto,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId = req.user.id;
    return await this.revenueService.createRevenue(dto, currentUserId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Get all revenues with optional filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by revenue category' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by revenue source' })
  @ApiQuery({ name: 'receivedFrom', required: false, description: 'Filter by lead ID' })
  @ApiQuery({ name: 'relatedInvoiceId', required: false, description: 'Filter by invoice ID' })
  @ApiQuery({ name: 'createdBy', required: false, description: 'Filter by employee ID' })
  @ApiQuery({ name: 'minAmount', required: false, description: 'Filter by minimum amount' })
  @ApiQuery({ name: 'maxAmount', required: false, description: 'Filter by maximum amount' })
  @ApiQuery({ name: 'paymentMethod', required: false, description: 'Filter by payment method' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter revenues from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter revenues to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Pagination page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records per page', example: 10 })
  @ApiResponse({ status: 200, description: 'List of revenues', type: RevenueListResponseDto })
  async getAllRevenues(@Query() query: any): Promise<any> {
    return await this.revenueService.getAllRevenues(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Get a single revenue by ID' })
  @ApiParam({ name: 'id', description: 'Revenue ID', type: Number })
  @ApiResponse({ status: 200, description: 'Revenue retrieved successfully', type: RevenueSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Revenue not found' })
  async getRevenueById(@Param('id') id: string): Promise<any> {
    const revenueId = parseInt(id);
    return await this.revenueService.getRevenueById(revenueId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.revenues_permission)
  @ApiOperation({ summary: 'Update an existing revenue record' })
  @ApiResponse({ status: 200, description: 'Revenue updated successfully', type: RevenueUpdateResponseDto })
  @ApiResponse({ status: 404, description: 'Revenue not found' })
  async updateRevenue(@Body() dto: UpdateRevenueDto): Promise<any> {
    return await this.revenueService.updateRevenue(dto);
  }
}
