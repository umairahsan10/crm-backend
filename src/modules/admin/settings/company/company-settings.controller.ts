import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { CompanySettingsResponseDto } from './dto/company-settings-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('Admin Settings - Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/settings/company')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  /**
   * Get company settings (single company record, ID = 1)
   * Admin only
   */
  @Get()
  @ApiOperation({
    summary: 'Get company settings',
    description: 'Retrieve company settings. Only one company record exists (ID = 1). Admin only.',
  })
  @ApiOkResponse({
    type: CompanySettingsResponseDto,
    description: 'Company settings retrieved successfully.',
  })
  @ApiNotFoundResponse({ description: 'Company settings not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async getCompanySettings(): Promise<CompanySettingsResponseDto> {
    return this.companySettingsService.getCompanySettings();
  }

  /**
   * Update company settings (single company record, ID = 1)
   * Supports partial updates - can update single field or multiple fields
   * Admin only
   */
  @Put()
  @ApiOperation({
    summary: 'Update company settings',
    description: 'Update company settings. Supports partial updates - can update single field or multiple fields. Admin only.',
  })
  @ApiBody({ type: UpdateCompanySettingsDto })
  @ApiOkResponse({
    type: CompanySettingsResponseDto,
    description: 'Company settings updated successfully.',
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Validation error or update failed.' })
  @ApiNotFoundResponse({ description: 'Company settings not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing token.' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only admins can access this endpoint.' })
  async updateCompanySettings(
    @Body() dto: UpdateCompanySettingsDto,
  ): Promise<CompanySettingsResponseDto> {
    return this.companySettingsService.updateCompanySettings(dto);
  }
}

