 import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CalculateSalaryDto } from './dto/calculate-salary.dto';
import { AssignCommissionDto } from './dto/assign-commission.dto';
import { UpdateWithholdFlagDto } from './dto/update-withhold-flag.dto';
import { TransferCommissionDto } from './dto/transfer-commission.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { Departments } from '../../common/decorators/departments.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { RoleName } from '@prisma/client';

@Controller('salary')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('calculate')
  // @Permissions(PermissionName.salary_permission)
  async calculate(@Body() dto: CalculateSalaryDto) {
    console.log('Calculating salary for employee:', dto.employee_id);
    await this.financeService.calculateSalary(
      dto.employee_id,
      dto.start_date,
      dto.end_date,
    );

    return { message: 'successfully created' };
  }

  @Post('commission/assign')
  // @Permissions(PermissionName.commission_permission)
  async assignCommission(@Body() dto: AssignCommissionDto) {
    return await this.financeService.assignCommission(dto.project_id);
  }

  @Post('commission/withhold-flag')
  // @Permissions(PermissionName.commission_permission)
  async updateWithholdFlag(@Body() dto: UpdateWithholdFlagDto) {
    return await this.financeService.updateWithholdFlag(dto.employee_id, dto.flag);
  }

  @Post('commission/transfer')
  // @Permissions(PermissionName.commission_permission)
  async transferCommission(@Body() dto: TransferCommissionDto) {
    return await this.financeService.transferCommission(dto.employee_id, dto.amount, dto.direction);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async setSalary(@Body() dto: UpdateSalaryDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    
    const result = await this.financeService.updateSalary(
      dto.employee_id,
      dto.amount,
      currentUserId,
      isAdmin,
      dto.description
    );

    // Return the result directly (success or error response)
    return result;
  }
}
