import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';

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
}
