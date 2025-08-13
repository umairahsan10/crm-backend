import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpCode, 
  HttpStatus, 
  BadRequestException,
  Logger,
  Request
} from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { HolidayCreationResponseDto } from './dto/holiday-creation-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionName } from '../../../common/constants/permission.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    type: string;
    department?: string;
    [key: string]: any;
  };
}

@Controller('hr/attendance/holidays')
export class HolidayController {
  private readonly logger = new Logger(HolidayController.name);

  constructor(private readonly holidayService: HolidayService) {}

  // ==================== PUBLIC ENDPOINTS (All Employees) ====================

  /**
   * Get all holidays with optional filtering
   * All employees can view holidays
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllHolidays(
    @Query('year') year?: string,
    @Query('month') month?: string
  ): Promise<HolidayResponseDto[]> {
    try {
      const yearNum = year ? parseInt(year, 10) : undefined;
      const monthNum = month ? parseInt(month, 10) : undefined;

      if (year && isNaN(yearNum!)) {
        throw new BadRequestException('Year must be a valid number');
      }

      if (month && isNaN(monthNum!)) {
        throw new BadRequestException('Month must be a valid number');
      }

      if (month && !year) {
        throw new BadRequestException('Month parameter requires year parameter');
      }

      if (monthNum && (monthNum < 1 || monthNum > 12)) {
        throw new BadRequestException('Month must be between 1 and 12');
      }

      return await this.holidayService.getAllHolidays(yearNum, monthNum);
    } catch (error) {
      this.logger.error(`Error fetching holidays: ${error.message}`);
      throw error;
    }
  }



  /**
   * Get upcoming holidays
   * All employees can view upcoming holidays
   */
  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  async getUpcomingHolidays(@Query('limit') limit?: string): Promise<HolidayResponseDto[]> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestException('Limit must be a valid number between 1 and 100');
      }

      return await this.holidayService.getUpcomingHolidays(limitNum);
    } catch (error) {
      this.logger.error(`Error fetching upcoming holidays: ${error.message}`);
      throw error;
    }
  }



  /**
   * Get holiday statistics
   * All employees can view holiday statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getHolidayStats(@Query('year') year?: string): Promise<{
    totalHolidays: number;
    holidaysThisYear: number;
    upcomingHolidays: number;
    holidaysByMonth: { month: string; count: number }[];
  }> {
    try {
      const yearNum = year ? parseInt(year, 10) : undefined;
      
      if (year && isNaN(yearNum!)) {
        throw new BadRequestException('Year must be a valid number');
      }

      return await this.holidayService.getHolidayStats(yearNum);
    } catch (error) {
      this.logger.error(`Error fetching holiday stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific holiday by ID
   * All employees can view individual holidays
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getHolidayById(@Param('id') id: string): Promise<HolidayResponseDto> {
    try {
      const holidayId = parseInt(id, 10);
      if (isNaN(holidayId)) {
        throw new BadRequestException('Holiday ID must be a valid number');
      }

      return await this.holidayService.getHolidayById(holidayId);
    } catch (error) {
      this.logger.error(`Error fetching holiday ${id}: ${error.message}`);
      throw error;
    }
  }

  // ==================== ADMIN/HR ONLY ENDPOINTS ====================

  /**
   * Create a new holiday
   * Only HR and Admin can create holidays
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async createHoliday(@Body() createHolidayDto: CreateHolidayDto, @Request() req: AuthenticatedRequest): Promise<HolidayCreationResponseDto> {
    try {
      this.logger.log(`Creating holiday: ${createHolidayDto.holidayName} on ${createHolidayDto.holidayDate}`);
      
      // Determine user type: 'hr' for HR employees, 'admin' for admins
      const userType = req.user.type === 'employee' && req.user.department === 'HR' ? 'hr' : 'admin';
      
      return await this.holidayService.createHoliday(createHolidayDto, req.user.id, userType);
    } catch (error) {
      this.logger.error(`Error creating holiday: ${error.message}`);
      throw error;
    }
  }



  /**
   * Delete a holiday
   * Only HR and Admin can delete holidays
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionName.attendance_permission)
  async deleteHoliday(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<{ message: string }> {
    try {
      const holidayId = parseInt(id, 10);
      if (isNaN(holidayId)) {
        throw new BadRequestException('Holiday ID must be a valid number');
      }

      this.logger.log(`Deleting holiday ${holidayId}`);
      
      // Determine user type: 'hr' for HR employees, 'admin' for admins
      const userType = req.user.type === 'employee' && req.user.department === 'HR' ? 'hr' : 'admin';
      
      return await this.holidayService.deleteHoliday(holidayId, req.user.id, userType);
    } catch (error) {
      this.logger.error(`Error deleting holiday ${id}: ${error.message}`);
      throw error;
    }
  }

}
