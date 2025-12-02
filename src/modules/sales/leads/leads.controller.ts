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
  ForbiddenException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { RequestLeadsDto } from './dto/request-leads.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  LeadsAccessGuard,
  LeadCreationGuard,
  ArchivedLeadsAccessGuard,
} from './guards';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
@UseGuards(JwtAuthGuard, LeadsAccessGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @UseGuards(LeadCreationGuard)
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: CreateLeadDto })
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads' })
  @ApiResponse({ status: 200, description: 'Returns all leads.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter leads by name, email, or company',
  })
  findAll(@Query() query: any, @Request() req: any) {
    // Extract user role and ID from JWT payload
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('🔍 Controller - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);

    return this.leadsService.findAll(query, userRole, userId);
  }

  @Get('my-leads')
  @ApiOperation({ summary: 'Get leads assigned to current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns leads for the authenticated user.',
  })
  getMyLeads(@Query() query: any, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.leadsService.getMyLeads(query, userId, userRole);
  }

  @Get('statistics/overview')
  @ApiOperation({ summary: 'Get lead statistics overview' })
  @ApiResponse({
    status: 200,
    description: 'Returns overview statistics for leads.',
  })
  getLeadStatistics(@Request() req: any) {
    const userRole = req.user.role;
    const userUnitId = req.user.salesUnitId;
    return this.leadsService.getLeadStatistics(userRole, userUnitId);
  }

  @Get('filter-options/sales-units')
  @ApiOperation({ summary: 'Get sales units for filter dropdown' })
  getSalesUnitsForFilter(@Request() req: any) {
    const userRole = req.user.role;
    return this.leadsService.getSalesUnitsForFilter(userRole);
  }

  @Get('filter-options/employees')
  @ApiOperation({ summary: 'Get employees for filter dropdown' })
  @ApiQuery({ name: 'salesUnitId', required: false })
  getEmployeesForFilter(
    @Query('salesUnitId') salesUnitId?: string,
    @Request() req?: any,
  ) {
    const unitId = salesUnitId ? parseInt(salesUnitId) : undefined;
    const userRole = req?.user?.role;
    return this.leadsService.getEmployeesForFilter(unitId, userRole);
  }

  @Get('cracked')
  @ApiOperation({ summary: 'Get cracked leads' })
  @ApiResponse({ status: 200, description: 'Returns all cracked leads.' })
  getCrackedLeads(@Query() query: any, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('🔍 Controller - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);

    return this.leadsService.getCrackedLeads(query, userRole, userId);
  }

  @Get('cracked/:id')
  @ApiOperation({ summary: 'Get a single cracked lead by ID' })
  @ApiParam({ name: 'id', type: Number })
  getCrackedLead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;

    return this.leadsService.getCrackedLead(id, userRole, userId);
  }

  @Get('completed')
  @ApiOperation({
    summary:
      'Get completed leads - Returns leads with status "completed". Department managers and unit heads see all completed leads, other employees see only leads they cracked.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    type: Number,
    description: 'Employee ID to filter by. Required parameter.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term to filter leads by name, email, or phone',
  })
  @ApiQuery({
    name: 'salesUnitId',
    required: false,
    type: Number,
    description: 'Filter by sales unit ID',
  })
  @ApiQuery({
    name: 'industryId',
    required: false,
    type: Number,
    description: 'Filter by industry ID',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Minimum deal amount',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Maximum deal amount',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by (default: crackedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns completed leads with pagination.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid employee ID or missing required parameter.',
  })
  getCompletedLeads(
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Query() query: any,
  ) {
    return this.leadsService.getCompletedLeads(query, employeeId);
  }

  @Get('archived')
  @UseGuards(ArchivedLeadsAccessGuard)
  @ApiOperation({ summary: 'Get archived leads' })
  getArchivedLeads(@Query() query: any, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;

    console.log('🔍 Controller - Archived leads - req.user:', req.user);
    console.log('🔍 Controller - userRole:', userRole, 'userId:', userId);

    return this.leadsService.getArchivedLeads(query, userRole, userId);
  }

  @Get('archived/:id')
  @UseGuards(ArchivedLeadsAccessGuard)
  @ApiOperation({ summary: 'Get archived lead by ID' })
  @ApiParam({ name: 'id', type: Number })
  getArchivedLead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userRole = req.user.role;
    const userId = req.user.id;

    return this.leadsService.getArchivedLead(id, userRole, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Post('request')
  @ApiOperation({ summary: 'Request leads (bulk keep/release)' })
  @ApiBody({ type: RequestLeadsDto })
  requestLeads(@Body() requestLeadsDto: RequestLeadsDto, @Request() req: any) {
    console.log('🔍 ===== REQUEST LEADS DEBUG =====');
    console.log(
      '🔍 Raw request body:',
      JSON.stringify(requestLeadsDto, null, 2),
    );
    console.log('🔍 Body type:', typeof requestLeadsDto);
    console.log('🔍 keptLeadIds type:', typeof requestLeadsDto.keptLeadIds);
    console.log('🔍 keptLeadIds value:', requestLeadsDto.keptLeadIds);
    console.log('🔍 req object keys:', Object.keys(req));
    console.log('🔍 req.user:', req.user);
    console.log('🔍 req.user type:', typeof req.user);
    console.log('🔍 req.headers:', req.headers);
    console.log('🔍 req.headers.authorization:', req.headers?.authorization);

    if (!req.user) {
      console.log(
        '🔍 ERROR: req.user is undefined - JWT authentication failed',
      );
      throw new ForbiddenException('Authentication required');
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔍 userId:', userId, 'userRole:', userRole);

    return this.leadsService.requestLeads(requestLeadsDto, userId, userRole);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLeadDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.leadsService.update(id, updateLeadDto, userId);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update multiple leads' })
  @ApiBody({
    schema: { example: { leadIds: [1, 2], updateData: { status: 'new' } } },
  })
  bulkUpdateLeads(
    @Body() body: { leadIds: number[]; updateData: UpdateLeadDto },
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.leadsService.bulkUpdateLeads(
      body.leadIds,
      body.updateData,
      userId,
    );
  }
}
