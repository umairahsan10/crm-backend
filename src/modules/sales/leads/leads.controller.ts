import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { RequestLeadsDto } from './dto/request-leads.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LeadsAccessGuard, LeadCreationGuard } from './guards';

@Controller('leads')
@UseGuards(JwtAuthGuard, LeadsAccessGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @UseGuards(LeadCreationGuard)
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  findAll(@Query() query: any, @Request() req: any) {
    // Extract user role and unit from JWT payload
    const userRole = req.user.role;
    const userUnitId = req.user.salesUnitId;
    
    console.log('🔍 Controller - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userUnitId:', userUnitId);
    
    return this.leadsService.findAll(query, userRole, userUnitId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Post('request')
  requestLeads(@Body() requestLeadsDto: RequestLeadsDto, @Request() req: any) {
    return this.leadsService.requestLeads(requestLeadsDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.leadsService.update(id, updateLeadDto, userId);
  }

  @Get('cracked-leads')
  getCrackedLeads(@Query() query: any) {
    return this.leadsService.getCrackedLeads(query);
  }

  @Post('bulk-update')
  bulkUpdateLeads(
    @Body() body: { leadIds: number[]; updateData: UpdateLeadDto },
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.leadsService.bulkUpdateLeads(body.leadIds, body.updateData, userId);
  }

  @Get('statistics/overview')
  getLeadStatistics(@Request() req: any) {
    const userRole = req.user.role;
    const userUnitId = req.user.salesUnitId;
    return this.leadsService.getLeadStatistics(userRole, userUnitId);
  }
}
