import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, getSchemaPath } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseCreateResponseDto, ExpenseUpdateResponseDto, ExpenseListResponseDto, ExpenseSingleResponseDto, ExpenseErrorResponseDto } from './dto/expense-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Departments } from '../../../../common/decorators/departments.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@ApiTags('Accountant Expenses')
@Controller('accountant/expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // ==================== EXPENSE MANAGEMENT ENDPOINTS ====================

  /**
   * Create a new expense
   * Required Permissions: expenses_permission
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiResponse({ status: 201, description: 'Expense created successfully', type: ExpenseCreateResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed', type: ExpenseErrorResponseDto })
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId = req.user.id;
    return await this.expenseService.createExpense(dto, currentUserId);
  }

  /**
   * Get all expenses with optional filters
   * Required Permissions: expenses_permission
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Get all expenses with optional filters' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by expense category' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter expenses from this date' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter expenses up to this date' })
  @ApiQuery({ name: 'createdBy', required: false, type: Number, description: 'Filter by employee ID who created' })
  @ApiQuery({ name: 'minAmount', required: false, type: Number, description: 'Minimum expense amount' })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number, description: 'Maximum expense amount' })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String, description: 'Filter by payment method' })
  @ApiQuery({ name: 'processedByRole', required: false, type: String, description: 'Filter by processed role' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully', type: ExpenseListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid filters', type: ExpenseErrorResponseDto })
  async getAllExpenses(
    @Request() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('createdBy') createdBy?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('processedByRole') processedByRole?: string,
  ): Promise<any> {
    const filters = {
      category,
      fromDate,
      toDate,
      createdBy: createdBy ? parseInt(createdBy) : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      paymentMethod,
      processedByRole,
    };
    return await this.expenseService.getAllExpenses(filters);
  }

  /**
   * Get a single expense by ID
   * Required Permissions: expenses_permission
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Get a single expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully', type: ExpenseSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Expense not found', type: ExpenseErrorResponseDto })
  async getExpenseById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    return await this.expenseService.getExpenseById(id);
  }

  /**
   * Update an existing expense
   * Required Permissions: expenses_permission
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.expenses_permission)
  @ApiOperation({ summary: 'Update an existing expense' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiResponse({ status: 200, description: 'Expense updated successfully', type: ExpenseUpdateResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed', type: ExpenseErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Expense not found', type: ExpenseErrorResponseDto })
  async updateExpense(
    @Body() dto: UpdateExpenseDto,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId = req.user.id;
    return await this.expenseService.updateExpense(dto, currentUserId);
  }
} 