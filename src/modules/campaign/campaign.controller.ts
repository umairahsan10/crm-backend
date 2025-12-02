import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import {
  CampaignResponseDto,
  CampaignListResponseDto,
} from './dto/campaign-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth() // JWT auth header in Swagger
@Controller('campaigns')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('Marketing')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new campaign (Marketing only)' })
  @ApiResponse({
    status: 201,
    description: 'Campaign successfully created',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createCampaign(
    @Body() createCampaignDto: CreateCampaignDto,
    @Request() req,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.createCampaign(createCampaignDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Retrieve aggregated campaign statistics' })
  @ApiResponse({
    status: 200,
    description: 'Campaign statistics retrieved successfully',
  })
  async getCampaignStats(@Request() req): Promise<any> {
    return this.campaignService.getCampaignStats(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns (filterable and paginated)' })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns retrieved successfully',
    type: CampaignListResponseDto,
  })
  async getAllCampaigns(
    @Query() query: CampaignQueryDto,
    @Request() req,
  ): Promise<CampaignListResponseDto> {
    return this.campaignService.getAllCampaigns(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign retrieved successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.getCampaignById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign details by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign updated successfully',
    type: CampaignResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @Request() req,
  ): Promise<CampaignResponseDto> {
    return this.campaignService.updateCampaign(
      id,
      updateCampaignDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a campaign by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Campaign ID' })
  @ApiResponse({
    status: 200,
    description: 'Campaign successfully deleted',
    schema: { example: { message: 'Campaign deleted successfully' } },
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.campaignService.deleteCampaign(id, req.user.id);
  }
}
