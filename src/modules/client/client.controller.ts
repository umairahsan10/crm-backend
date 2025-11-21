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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { ClientResponseDto, ClientListResponseDto } from './dto/client-response.dto';
import { FindByEmailDto } from './dto/find-by-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BlockProductionGuard } from '../../common/guards/block-production.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string | number;
    type: string;
    departmentId?: number;
  };
}

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, BlockProductionGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead)
  @ApiOperation({ summary: 'Create a new client record' })
  @ApiResponse({ status: 201, description: 'Client created successfully', type: ClientResponseDto })
  async create(
    @Body() createClientDto: CreateClientDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string; data: { client: ClientResponseDto } }> {
    const client = await this.clientService.create(createClientDto, req.user.id);
    return {
      status: 'success',
      message: 'Client created successfully',
      data: { client },
    };
  }

  @Get()
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead, RoleName.senior, RoleName.junior)
  @ApiOperation({ summary: 'Retrieve all clients with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of clients retrieved', type: ClientListResponseDto })
  async findAll(
    @Query() query: ClientQueryDto,
  ): Promise<{ status: string; message: string; data: ClientListResponseDto }> {
    const result = await this.clientService.findAll(query);
    return {
      status: 'success',
      message: 'Clients retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead)
  @ApiOperation({ summary: 'Get client statistics (aggregated data)' })
  async getStats(): Promise<{ status: string; message: string; data: any }> {
    const stats = await this.clientService.getClientStats();
    return {
      status: 'success',
      message: 'Client statistics retrieved successfully',
      data: stats,
    };
  }

  @Post('by-email')
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead, RoleName.senior, RoleName.junior)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a specific client by email address' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully', type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found with the provided email' })
  async findByEmail(
    @Body() findByEmailDto: FindByEmailDto,
  ): Promise<{ status: string; message: string; data: { client: ClientResponseDto } }> {
    const client = await this.clientService.findByEmail(findByEmailDto.email);
    return {
      status: 'success',
      message: 'Client retrieved successfully',
      data: { client },
    };
  }

  @Get(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead, RoleName.senior, RoleName.junior)
  @ApiOperation({ summary: 'Retrieve a specific client by ID' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully', type: ClientResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ status: string; message: string; data: { client: ClientResponseDto } }> {
    const client = await this.clientService.findOne(id);
    return {
      status: 'success',
      message: 'Client retrieved successfully',
      data: { client },
    };
  }

  @Patch(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing client record' })
  @ApiResponse({ status: 200, description: 'Client updated successfully', type: ClientResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<{ status: string; message: string; data: { client: ClientResponseDto } }> {
    const client = await this.clientService.update(id, updateClientDto);
    return {
      status: 'success',
      message: 'Client updated successfully',
      data: { client },
    };
  }

  @Delete(':id')
  @Roles(RoleName.dep_manager, RoleName.unit_head)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a client by ID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ status: string; message: string }> {
    await this.clientService.remove(id);
    return {
      status: 'success',
      message: 'Client deleted successfully',
    };
  }

  @Get('search/companies')
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead, RoleName.senior, RoleName.junior)
  @ApiOperation({ summary: 'Search companies by name or keyword' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term for company names' })
  async searchCompanies(
    @Query('q') query: string,
  ): Promise<{ status: string; message: string; data: { companies: any[] } }> {
    const searchQuery: ClientQueryDto = { search: query, limit: 10 };
    const result = await this.clientService.findAll(searchQuery);
    const companies = result.clients.map(client => ({
      id: client.id,
      companyName: client.companyName,
      clientName: client.clientName,
      email: client.email,
      city: client.city,
      state: client.state,
    }));
    return {
      status: 'success',
      message: 'Companies found successfully',
      data: { companies },
    };
  }

  @Get('search/contacts')
  @Roles(RoleName.dep_manager, RoleName.unit_head, RoleName.team_lead, RoleName.senior, RoleName.junior)
  @ApiOperation({ summary: 'Search client contacts by name or email' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term for contact name or email' })
  async searchContacts(
    @Query('q') query: string,
  ): Promise<{ status: string; message: string; data: { contacts: any[] } }> {
    const searchQuery: ClientQueryDto = { search: query, limit: 10 };
    const result = await this.clientService.findAll(searchQuery);
    const contacts = result.clients.map(client => ({
      id: client.id,
      clientName: client.clientName,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      city: client.city,
    }));
    return {
      status: 'success',
      message: 'Contacts found successfully',
      data: { contacts },
    };
  }
}
