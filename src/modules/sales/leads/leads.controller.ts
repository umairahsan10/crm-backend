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
import { LeadsAccessGuard, LeadCreationGuard, ArchivedLeadsAccessGuard } from './guards';

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
    // Extract user role and ID from JWT payload
    const userRole = req.user.role;
    const userId = req.user.id;
    
    console.log('🔍 Controller - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);
    
    return this.leadsService.findAll(query, userRole, userId);
  }

  @Get('my-leads')
  getMyLeads(@Query() query: any, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.leadsService.getMyLeads(query, userId, userRole);
  }


  @Get('statistics/overview')
  getLeadStatistics(@Request() req: any) {
    const userRole = req.user.role;
    const userUnitId = req.user.salesUnitId;
    return this.leadsService.getLeadStatistics(userRole, userUnitId);
  }

  @Get('filter-options/sales-units')
  getSalesUnitsForFilter(@Request() req: any) {
    const userRole = req.user.role;
    return this.leadsService.getSalesUnitsForFilter(userRole);
  }

  @Get('filter-options/employees')
  getEmployeesForFilter(@Query('salesUnitId') salesUnitId?: string, @Request() req?: any) {
    const unitId = salesUnitId ? parseInt(salesUnitId) : undefined;
    const userRole = req?.user?.role;
    return this.leadsService.getEmployeesForFilter(unitId, userRole);
  }

  @Get('cracked')
  getCrackedLeads(@Query() query: any, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    console.log('🔍 Controller - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);
    
    return this.leadsService.getCrackedLeads(query, userRole, userId);
  }

  @Get('archived')
  @UseGuards(ArchivedLeadsAccessGuard)
  getArchivedLeads(@Query() query: any, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    console.log('🔍 Controller - Archived leads - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);
    
    return this.leadsService.getArchivedLeads(query, userRole, userId);
  }

  @Get('archived/:id')
  @UseGuards(ArchivedLeadsAccessGuard)
  getArchivedLead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    return this.leadsService.getArchivedLead(id, userRole, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Post('request')
  requestLeads(@Body() requestLeadsDto: RequestLeadsDto, @Request() req: any) {
    console.log('🔍 ===== REQUEST LEADS DEBUG =====');
    console.log('🔍 Raw request body:', JSON.stringify(requestLeadsDto, null, 2));
    console.log('🔍 Body type:', typeof requestLeadsDto);
    console.log('🔍 keptLeadIds type:', typeof requestLeadsDto.keptLeadIds);
    console.log('🔍 keptLeadIds value:', requestLeadsDto.keptLeadIds);
    console.log('🔍 req object keys:', Object.keys(req));
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.user type:', typeof req.user);
    console.log('🔍 req.headers:', req.headers);
    console.log('🔍 req.headers.authorization:', req.headers?.authorization);
    
    if (!req.user) {
      console.log('🔍 ERROR: req.user is undefined - JWT authentication failed');
      throw new ForbiddenException('Authentication required');
    }
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('🔍 userId:', userId, 'userRole:', userRole);
    
    return this.leadsService.requestLeads(requestLeadsDto, userId, userRole);
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

  @Post('bulk-update')
  bulkUpdateLeads(
    @Body() body: { leadIds: number[]; updateData: UpdateLeadDto },
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.leadsService.bulkUpdateLeads(body.leadIds, body.updateData, userId);
  }

}
