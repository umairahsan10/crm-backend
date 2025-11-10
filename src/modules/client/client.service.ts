import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { ClientResponseDto, ClientListResponseDto } from './dto/client-response.dto';
import { Client, Prisma } from '@prisma/client';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto, createdBy: number): Promise<ClientResponseDto> {
    try {
      // Check if email already exists
      if (createClientDto.email) {
        const existingClient = await this.prisma.client.findFirst({
          where: { email: createClientDto.email }
        });
        if (existingClient) {
          throw new ConflictException('Client with this email already exists');
        }
      }

      // Check if industry exists if provided
      if (createClientDto.industryId) {
        const industry = await this.prisma.industry.findUnique({
          where: { id: createClientDto.industryId }
        });
        if (!industry) {
          throw new BadRequestException('Industry not found');
        }
      }

      // Get the next available ID (largest ID + 1)
      const maxClientId = await this.prisma.client.aggregate({
        _max: { id: true }
      });
      const nextClientId = (maxClientId._max.id || 0) + 1;

      const client = await this.prisma.client.create({
        data: {
          id: nextClientId, // Use explicit ID to avoid sequence conflicts
          ...createClientDto,
          createdBy,
          accountStatus: createClientDto.accountStatus || 'prospect'
        },
        include: {
          industry: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return this.mapToResponseDto(client);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create client');
    }
  }

  async findAll(query: ClientQueryDto): Promise<ClientListResponseDto> {
    const {
      search,
      clientType,
      companyName,
      clientName,
      email,
      phone,
      city,
      state,
      country,
      industryId,
      accountStatus,
      createdBy,
      createdAfter,
      createdBefore,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = query;

    // Build where clause
    const where: Prisma.ClientWhereInput = {};

    // Search across multiple fields
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Individual field filters
    if (clientType) where.clientType = clientType;
    if (companyName) where.companyName = { contains: companyName, mode: 'insensitive' };
    if (clientName) where.clientName = { contains: clientName, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (phone) where.phone = { contains: phone, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (industryId) where.industryId = industryId;
    if (accountStatus) where.accountStatus = accountStatus;
    if (createdBy) where.createdBy = createdBy;

    // Date range filters
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    // Build orderBy clause
    const orderBy: Prisma.ClientOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.ClientOrderByWithRelationInput] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    try {
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          include: {
            industry: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.client.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        clients: clients.map(client => this.mapToResponseDto(client)),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch clients');
    }
  }

  async findOne(id: number): Promise<ClientResponseDto> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          industry: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      return this.mapToResponseDto(client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch client');
    }
  }

  async findByEmail(email: string): Promise<ClientResponseDto> {
    try {
      const client = await this.prisma.client.findFirst({
        where: { email },
        include: {
          industry: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!client) {
        throw new NotFoundException('Client not found with the provided email');
      }

      return this.mapToResponseDto(client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch client by email');
    }
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<ClientResponseDto> {
    try {
      // Check if client exists
      const existingClient = await this.prisma.client.findUnique({
        where: { id }
      });

      if (!existingClient) {
        throw new NotFoundException('Client not found');
      }

      // Check if email already exists (excluding current client)
      if (updateClientDto.email) {
        const emailExists = await this.prisma.client.findFirst({
          where: {
            email: updateClientDto.email,
            id: { not: id }
          }
        });
        if (emailExists) {
          throw new ConflictException('Client with this email already exists');
        }
      }

      // Check if industry exists if provided
      if (updateClientDto.industryId) {
        const industry = await this.prisma.industry.findUnique({
          where: { id: updateClientDto.industryId }
        });
        if (!industry) {
          throw new BadRequestException('Industry not found');
        }
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
        include: {
          industry: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return this.mapToResponseDto(client);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update client');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id }
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      await this.prisma.client.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete client');
    }
  }

  async getClientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    prospect: number;
  }> {
    try {
      const [total, active, inactive, suspended, prospect] = await Promise.all([
        this.prisma.client.count(),
        this.prisma.client.count({ where: { accountStatus: 'active' } }),
        this.prisma.client.count({ where: { accountStatus: 'inactive' } }),
        this.prisma.client.count({ where: { accountStatus: 'suspended' } }),
        this.prisma.client.count({ where: { accountStatus: 'prospect' } })
      ]);

      return {
        total,
        active,
        inactive,
        suspended,
        prospect
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch client statistics');
    }
  }

  private mapToResponseDto(client: any): ClientResponseDto {
    return {
      id: client.id,
      clientType: client.clientType,
      companyName: client.companyName,
      clientName: client.clientName,
      email: client.email,
      phone: client.phone,
      altPhone: client.altPhone,
      address: client.address,
      city: client.city,
      state: client.state,
      postalCode: client.postalCode,
      country: client.country,
      industryId: client.industryId,
      taxId: client.taxId,
      accountStatus: client.accountStatus,
      createdBy: client.createdBy,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      industry: client.industry,
      employee: client.employee
    };
  }
}
