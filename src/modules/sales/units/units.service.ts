import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(createUnitDto: CreateUnitDto) {
    const { name, email, phone, address, headId, logoUrl, website } = createUnitDto;

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: headId },
      include: { role: true }
    });

    if (!employee) {
      throw new BadRequestException(`Employee with ID ${headId} does not exist`);
    }

    // Check if employee has unit_head role
    if (employee.role.name !== 'unit_head') {
      throw new BadRequestException('Employee must have unit_head role to be assigned as unit head');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.salesUnit.findUnique({
      where: { email }
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.salesUnit.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Check if name already exists
    const existingName = await this.prisma.salesUnit.findUnique({
      where: { name }
    });

    if (existingName) {
      throw new ConflictException('Unit name already exists');
    }

    // Create the sales unit
    const newUnit = await this.prisma.salesUnit.create({
      data: {
        name,
        email,
        phone,
        address,
        headId,
        logoUrl,
        website
        // createdAt and updatedAt are automatically handled by Prisma
      }
    });

    return {
      success: true,
      message: 'New Unit Created Successfully'
    };
  }

  async getAllUnits() {
    const units = await this.prisma.salesUnit.findMany({
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      data: units.map(unit => ({
        id: unit.id,
        name: unit.name,
        email: unit.email,
        phone: unit.phone,
        address: unit.address,
        headId: unit.headId,
        logoUrl: unit.logoUrl,
        website: unit.website,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        headFirstName: unit.head?.firstName || null,
        headLastName: unit.head?.lastName || null
      })),
      total: units.length,
      message: units.length > 0 ? 'Units retrieved successfully' : 'No units found'
    };
  }

  async updateUnit(id: number, updateUnitDto: UpdateUnitDto) {
    // Check if unit exists
    const existingUnit = await this.prisma.salesUnit.findUnique({
      where: { id }
    });

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} does not exist`);
    }

    const { name, email, phone, address, headId, logoUrl, website } = updateUnitDto;

    // Check if employee exists and has unit_head role (if headId is provided)
    if (headId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: headId },
        include: { role: true }
      });

      if (!employee) {
        throw new BadRequestException(`Employee with ID ${headId} does not exist`);
      }

      if (employee.role.name !== 'unit_head') {
        throw new BadRequestException('Employee must have unit_head role to be assigned as unit head');
      }
    }

    // Check if email already exists (exclude current unit)
    if (email) {
      const existingEmail = await this.prisma.salesUnit.findFirst({
        where: { 
          email,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if phone already exists (exclude current unit)
    if (phone) {
      const existingPhone = await this.prisma.salesUnit.findFirst({
        where: { 
          phone,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Check if name already exists (exclude current unit)
    if (name) {
      const existingName = await this.prisma.salesUnit.findFirst({
        where: { 
          name,
          id: { not: id } // Exclude current unit
        }
      });

      if (existingName) {
        throw new ConflictException('Unit name already exists');
      }
    }

    // Update the sales unit (only provided fields)
    await this.prisma.salesUnit.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(headId && { headId }),
        ...(logoUrl && { logoUrl }),
        ...(website && { website })
        // updatedAt is automatically handled by Prisma @updatedAt
      }
    });

    return {
      success: true,
      message: 'Unit updated successfully'
    };
  }
}
