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
  HttpStatus
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { CampaignResponseDto, CampaignListResponseDto } from './dto/campaign-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentsGuard } from '../../common/guards/departments.guard';
import { Departments } from '../../common/decorators/departments.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, DepartmentsGuard)
@Departments('Marketing')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @Body() createCampaignDto: CreateCampaignDto,
    @Request() req
  ): Promise<CampaignResponseDto> {
    return this.campaignService.createCampaign(createCampaignDto, req.user.id);
  }

  @Get('stats')
  async getCampaignStats(@Request() req): Promise<any> {
    return this.campaignService.getCampaignStats(req.user.id);
  }

  @Get()
  async getAllCampaigns(
    @Query() query: CampaignQueryDto,
    @Request() req
  ): Promise<CampaignListResponseDto> {
    return this.campaignService.getAllCampaigns(query, req.user.id);
  }

  @Get(':id')
  async getCampaignById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<CampaignResponseDto> {
    return this.campaignService.getCampaignById(id, req.user.id);
  }

  @Patch(':id')
  async updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @Request() req
  ): Promise<CampaignResponseDto> {
    return this.campaignService.updateCampaign(id, updateCampaignDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{ message: string }> {
    return this.campaignService.deleteCampaign(id, req.user.id);
  }
}
