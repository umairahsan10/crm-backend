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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ErrorResponseDto } from './expense.service';
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
  async updateExpense(
    @Body() dto: UpdateExpenseDto,
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const currentUserId = req.user.id;
    return await this.expenseService.updateExpense(dto, currentUserId);
  }
} 