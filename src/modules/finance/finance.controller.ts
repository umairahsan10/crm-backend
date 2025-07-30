import { Body, Controller, Post } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CalculateSalaryDto } from './dto/calculate-salary.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionName } from '../../common/constants/permission.enum';

@Controller('salary')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('calculate')
  @Permissions(PermissionName.salary_permission)
  async calculate(@Body() dto: CalculateSalaryDto) {
    await this.financeService.calculateSalary(
      dto.employee_id,
      dto.start_date,
      dto.end_date,
    );

    return { message: 'successfully created' };
  }
}
