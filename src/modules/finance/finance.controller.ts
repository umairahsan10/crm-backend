import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';
import { AssignCommissionDto } from './dto/assign-commission.dto';
import { UpdateWithholdFlagDto } from './dto/update-withhold-flag.dto';
import { TransferCommissionDto } from './dto/transfer-commission.dto';
import { RoleName } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Salary')
@ApiBearerAuth()
@Controller('salary')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * Trigger automatic salary calculation for all active employees
   *
   * This endpoint manually triggers the same process that runs automatically
   * via cron job on the 4th of every month. It calculates salary (base + bonus + commissions)
   * and deductions for all active employees and stores the results in net_salary_logs.
   *
   * This is useful for:
   * - Manual salary processing outside the scheduled time
   * - Testing the salary calculation system
   * - Processing salaries for specific scenarios
   *
   * @returns Success message confirming salary calculation completion
   *
   * Note: No authentication required for this endpoint (cron job compatibility)
   */
  @Post('auto')
  @ApiOperation({
    summary: 'Trigger automatic salary calculation for all employees',
  })
  @ApiResponse({
    status: 200,
    description: 'Salary calculation triggered successfully',
    schema: {
      example: { message: 'Salary calculation triggered for all employees' },
    },
  })
  async calculateAll() {
    await this.financeService.calculateAllEmployees();
    return { message: 'Salary calculation triggered for all employees' };
  }

  @Post('commission/assign')
  // @Permissions(PermissionName.commission_permission)
  @ApiOperation({
    summary: 'Assign commission to employee for a completed project',
  })
  @ApiBody({ schema: { example: { project_id: 101 } } })
  @ApiResponse({
    status: 200,
    description: 'Commission assigned successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Commission assigned',
        employee_id: 123,
        commission_amount: 2500,
        withheld: false,
      },
    },
  })
  async assignCommission(@Body() dto: AssignCommissionDto) {
    return await this.financeService.assignCommission(dto.project_id);
  }

  @Post('commission/withhold-flag')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Roles(RoleName.dep_manager)
  @ApiOperation({ summary: 'Update withhold flag for a sales employee' })
  @ApiBody({ schema: { example: { employee_id: 123, flag: true } } })
  @ApiResponse({
    status: 200,
    description: 'Withhold flag updated successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Withhold flag updated',
        employee_id: 123,
        new_flag: true,
      },
    },
  })
  async updateWithholdFlag(@Body() dto: UpdateWithholdFlagDto) {
    return await this.financeService.updateWithholdFlag(
      dto.employee_id,
      dto.flag,
    );
  }

  @Post('commission/transfer')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Roles(RoleName.dep_manager)
  // @Permissions(PermissionName.commission_permission)
  @ApiOperation({
    summary: 'Transfer commission between withheld and available amount',
  })
  @ApiBody({
    schema: {
      example: { employee_id: 123, amount: 1000, direction: 'release' },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Commission transferred successfully',
    schema: {
      example: {
        status: 'success',
        message: 'Commission released',
        employee_id: 123,
        transferred_amount: 1000,
        from: 'withhold_commission',
        to: 'commission_amount',
        new_balances: { commission_amount: 3500, withhold_commission: 0 },
      },
    },
  })
  async transferCommission(@Body() dto: TransferCommissionDto) {
    return await this.financeService.transferCommission(
      dto.employee_id,
      dto.amount,
      dto.direction,
    );
  }

  /**
   * Get commission details for all sales employees.
   * This endpoint retrieves commission details including withheld and available amounts.
   */
  @Get('commission/details')
  @ApiOperation({ summary: 'Get commission details for all sales employees' })
  @ApiResponse({
    status: 200,
    description: 'Commission details retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          name: 'John Doe',
          commissionAmount: 5000,
          withholdCommission: 1000,
        },
      ],
    },
  })
  async getSalesCommissionDetails() {
    return await this.financeService.getSalesCommissionDetails();
  }

  /**
   * Get projects suitable for assigning commissions.
   * Returns project IDs and names where the status is 'completed'.
   */
  @Get('commission/projects')
  @ApiOperation({ summary: 'Get projects suitable for assigning commissions' })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    schema: {
      example: [
        { id: 1, name: 'Project Alpha' },
        { id: 2, name: 'Project Beta' },
      ],
    },
  })
  async getProjectsForCommission() {
    return await this.financeService.getProjectsForCommission();
  }
}
