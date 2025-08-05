import { Body, Controller, Patch, UseGuards, Request } from '@nestjs/common';
import { AccountantService } from './accountant.service';
import { UpdatePermissionsDto } from './dto/update-permission.dto';
import { PermissionsResponseDto } from './dto/permission-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { DepartmentsGuard } from '../../../common/guards/departments.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Departments } from '../../../common/decorators/departments.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    role?: string;
    department?: string;
    [key: string]: any;
  };
}

@Controller('accountant')
export class AccountantController {
  constructor(private readonly accountantService: AccountantService) {}

  /**
   * Update permissions for an accountant
   * 
   * This endpoint allows admins or account managers to update permissions for accountants:
   * 1. Validates that the target employee exists and is active
   * 2. Ensures the employee is in the Accounts department
   * 3. Verifies the accountant record exists
   * 4. Applies permission restrictions (admin bypass, account manager restrictions)
   * 5. Updates all specified permission flags
   * 6. Creates audit log entry for tracking
   * 
   * @param dto - Contains employee_id and permissions object
   * @param req - Authenticated request containing user details
   * @returns Success/error response with updated permissions and previous state
   * 
   * Required Permissions: Any accountant permission (for validation)
   * Required Department: Accounts (for account managers)
   * Admin bypass: Yes (admins can update any accountant permissions)
   */
  @Patch('permissions')
  @UseGuards(JwtAuthGuard, RolesGuard, DepartmentsGuard, PermissionsGuard)
  @Departments('Accounts')
  @Permissions(PermissionName.salary_permission) // Using salary_permission as a representative permission
  async updatePermissions(
    @Body() dto: UpdatePermissionsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<PermissionsResponseDto> {
    const currentUserId = req.user.id;
    const isAdmin = req.user.type === 'admin';
    
    const result = await this.accountantService.updatePermissions(
      dto,
      currentUserId,
      isAdmin
    );

    // Return the result directly (success or error response)
    return result;
  }
}
