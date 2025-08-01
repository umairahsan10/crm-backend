import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { HrService } from './hr.service';
import { MarkSalaryPaidDto } from './dto/mark-salary-paid.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';
import { Departments } from '../../common/decorators/departments.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Patch('salary/mark-paid')
  @UseGuards(JwtAuthGuard, PermissionsGuard, DepartmentsGuard)
  @Permissions(PermissionName.salary_permission)
  @Departments('HR')
  async markSalaryPaid(@Body() dto: MarkSalaryPaidDto, @Req() req: any) {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    return await this.hrService.markSalaryPaid(dto, currentUserId, isAdmin);
  }
}
