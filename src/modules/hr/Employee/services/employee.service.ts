import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { FinanceService } from '../../../finance/finance.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { CreateCompleteEmployeeDto } from '../dto/create-complete-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { GetEmployeesDto } from '../dto/get-employees.dto';
import { EmployeeStatisticsDto } from '../dto/employee-statistics.dto';
import { HrLogsStatsResponseDto } from '../../dto/hr-logs-stats.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) { }

  /**
   * Helper method to get current date in PKT timezone
   */
  private getCurrentDateInPKT(): Date {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Karachi"}));
  }

  /**
   * Validate role-based hierarchy constraints
   * 
   * Rules:
   * - team_lead: Can't have team_lead, only unit_head and dep_manager
   * - unit_head: Can't have team_lead or unit_head, only dep_manager  
   * - dep_manager: Can't have anyone above (no team_lead, unit_head, dep_manager)
   */
  private async validateRoleHierarchy(roleId: number, managerId?: number, teamLeadId?: number): Promise<void> {
    // Get the role information
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const roleName = role.name;

    // Validate based on role hierarchy
    switch (roleName) {
      case 'team_lead':
        // Team lead can't have a team lead
        if (teamLeadId) {
          throw new BadRequestException('Team Lead cannot have a Team Lead. Only Unit Head and Department Manager are allowed.');
        }
        // Validate manager is unit_head or dep_manager
        if (managerId) {
          const manager = await this.prisma.employee.findUnique({
            where: { id: managerId },
            include: { role: true },
          });
          if (manager && !['unit_head', 'dep_manager'].includes(manager.role.name)) {
            throw new BadRequestException('Team Lead can only report to Unit Head or Department Manager.');
          }
        }
        break;

      case 'unit_head':
        // Unit head can't have team lead or unit head
        if (teamLeadId) {
          throw new BadRequestException('Unit Head cannot have a Team Lead.');
        }
        if (managerId) {
          const manager = await this.prisma.employee.findUnique({
            where: { id: managerId },
            include: { role: true },
          });
          if (manager && !['dep_manager'].includes(manager.role.name)) {
            throw new BadRequestException('Unit Head can only report to Department Manager.');
          }
        }
        break;

      case 'dep_manager':
        // Department manager can't have anyone above
        if (teamLeadId) {
          throw new BadRequestException('Department Manager cannot have a Team Lead.');
        }
        if (managerId) {
          throw new BadRequestException('Department Manager cannot have a manager.');
        }
        break;

      case 'senior':
      case 'junior':
        // Senior and Junior can have any manager/team lead (no restrictions)
        break;

      default:
        this.logger.warn(`Unknown role: ${roleName}. Skipping hierarchy validation.`);
        break;
    }
  }

  async terminateEmployee(employeeId: number, terminationDate: string, hrEmployeeId: number, description?: string) {
    // Validate date format
    const parsedDate = new Date(terminationDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date format: ${terminationDate}. Please use YYYY-MM-DD format (e.g., 2025-07-31)`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Check if employee is already terminated
    if (employee.status === 'terminated') {
      throw new BadRequestException(`Employee ${employeeId} is already terminated`);
    }

    // Get HR employee details for logging
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    try {
      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Update employee status first
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            endDate: parsedDate,
            status: 'terminated',
          },
        });

        // Try to calculate salary - this might fail if no base salary is set
        try {
          await this.financeService.calculateSalaryManual(employeeId);
          this.logger.log(`Salary calculated for terminated employee ${employeeId}`);
        } catch (salaryError) {
          this.logger.warn(`Could not calculate salary for employee ${employeeId}: ${salaryError.message}. Employee terminated but no salary processed.`);
          // Continue with termination even if salary calculation fails
        }

        // Create HR log entry
        const logDescription = description ||
          `Employee ${employee.firstName} ${employee.lastName} terminated on ${terminationDate}`;
        
        await this.createHrLog(hrEmployeeId, 'employee_terminated', employeeId, logDescription);
      });

      this.logger.log(
        `Employee ${employeeId} terminated on ${terminationDate}.`,
      );
    } catch (error) {
      this.logger.error(`Failed to terminate employee ${employeeId}: ${error.message}`);
      throw new BadRequestException(`Failed to terminate employee: ${error.message}`);
    }
  }

  private getOrderByClause(orderBy: string, orderDirection: string) {
    // Map frontend field names to Prisma field names
    const fieldMapping: { [key: string]: string } = {
      'id': 'id',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'actionType': 'actionType',
      'affectedEmployeeId': 'affectedEmployeeId'
    };

    const prismaField = fieldMapping[orderBy] || 'createdAt';
    return { [prismaField]: orderDirection };
  }

  async getHrLogs(query: any) {
    const { 
      hr_id, 
      action_type, 
      affected_employee_id, 
      start_date, 
      end_date,
      created_start,
      created_end,
      updated_start,
      updated_end,
      page = 1, 
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = query;

    // Ensure page and limit are numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (hr_id) {
      where.hrId = hr_id;
    }

    if (action_type) {
      where.actionType = action_type;
    }

    if (affected_employee_id) {
      where.affectedEmployeeId = affected_employee_id;
    }

    // Handle date filtering - prioritize specific date parameters over generic ones
    if (created_start || created_end) {
      where.createdAt = {};
      if (created_start) {
        where.createdAt.gte = new Date(created_start);
      }
      if (created_end) {
        where.createdAt.lte = new Date(created_end);
      }
    } else if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = new Date(start_date);
      }
      if (end_date) {
        where.createdAt.lte = new Date(end_date);
      }
    }

    if (updated_start || updated_end) {
      where.updatedAt = {};
      if (updated_start) {
        where.updatedAt.gte = new Date(updated_start);
      }
      if (updated_end) {
        where.updatedAt.lte = new Date(updated_end);
      }
    }

    try {
      console.log('HR Logs Query Debug:', {
        pageNum,
        limitNum,
        skip,
        where,
        orderBy,
        orderDirection,
        orderByClause: this.getOrderByClause(orderBy, orderDirection)
      });

      const [logs, total] = await Promise.all([
        this.prisma.hRLog.findMany({
          where,
          include: {
            affectedEmployee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            hr: {
              include: {
                employee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: this.getOrderByClause(orderBy, orderDirection),
          skip,
          take: limitNum,
        }),
        this.prisma.hRLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log('HR Logs Result Debug:', {
        logsCount: logs.length,
        total,
        pageNum,
        limitNum,
        totalPages,
        skip
      });

      return {
        logs: logs.map(log => ({
          id: log.id,
          hrId: log.hrId,
          actionType: log.actionType,
          affectedEmployeeId: log.affectedEmployeeId,
          description: log.description,
          createdAt: log.createdAt.toISOString(),
          updatedAt: log.updatedAt.toISOString(),
          affectedEmployee: log.affectedEmployee,
          hr: log.hr,
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get HR logs: ${error.message}`);
      throw new BadRequestException(`Failed to get HR logs: ${error.message}`);
    }
  }

  /**
   * Create a complete employee with all related records in a single transaction
   * This method handles employee creation, department-specific records, and bank account
   */
  async createCompleteEmployee(dto: CreateCompleteEmployeeDto, hrEmployeeId: number) {
    // Validate email uniqueness
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: dto.employee.email },
    });

    if (existingEmployee) {
      throw new BadRequestException(`Employee with email ${dto.employee.email} already exists`);
    }

    // Validate department exists
    const department = await this.prisma.department.findUnique({
      where: { id: dto.employee.departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.employee.departmentId} not found`);
    }

    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.employee.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.employee.roleId} not found`);
    }

    // Validate manager if provided
    if (dto.employee.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.employee.managerId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${dto.employee.managerId} not found`);
      }
    }

    // Validate team lead if provided
    if (dto.employee.teamLeadId) {
      const teamLead = await this.prisma.employee.findUnique({
        where: { id: dto.employee.teamLeadId },
      });

      if (!teamLead) {
        throw new NotFoundException(`Team Lead with ID ${dto.employee.teamLeadId} not found`);
      }
    }

    // Validate role hierarchy constraints
    await this.validateRoleHierarchy(
      dto.employee.roleId,
      dto.employee.managerId,
      dto.employee.teamLeadId
    );

    // Department-specific validation
    const departmentName = department.name;

    // CRITICAL VALIDATION 1: Ensure only ONE department data is provided
    const departmentDataKeys = dto.departmentData ? Object.keys(dto.departmentData).filter(key => dto.departmentData![key] !== null && dto.departmentData![key] !== undefined) : [];
    
    if (departmentDataKeys.length > 1) {
      throw new BadRequestException(`Only one department data should be provided. Found: ${departmentDataKeys.join(', ')}`);
    }

    // CRITICAL VALIDATION 2: Ensure department data matches the selected department
    const departmentDataMapping = {
      'HR': 'hr',
      'Sales': 'sales',
      'Marketing': 'marketing',
      'Production': 'production',
      'Accounts': 'accountant'
    };

    const expectedKey = departmentDataMapping[departmentName];
    
    if (departmentDataKeys.length > 0) {
      const providedKey = departmentDataKeys[0];
      if (expectedKey && providedKey !== expectedKey) {
        throw new BadRequestException(
          `Department data mismatch. Selected department is '${departmentName}' but provided data for '${providedKey}'. ` +
          `Please provide '${expectedKey}' data for ${departmentName} department.`
        );
      }
    }

    // CRITICAL VALIDATION 3: For Sales department, ensure data is provided and withholdCommission/withholdFlag are present
    if (departmentName === 'Sales') {
      if (!dto.departmentData?.sales) {
        throw new BadRequestException('Sales department data is required when creating a Sales employee');
      }
      
      if (dto.departmentData.sales.withholdCommission === undefined || dto.departmentData.sales.withholdCommission === null) {
        throw new BadRequestException('withholdCommission is required for Sales department');
      }
      if (dto.departmentData.sales.withholdFlag === undefined || dto.departmentData.sales.withholdFlag === null) {
        throw new BadRequestException('withholdFlag is required for Sales department');
      }

      // Validate sales unit if provided
      if (dto.departmentData.sales.salesUnitId) {
        const salesUnit = await this.prisma.salesUnit.findUnique({
          where: { id: dto.departmentData.sales.salesUnitId },
        });
        if (!salesUnit) {
          throw new NotFoundException(`Sales Unit with ID ${dto.departmentData.sales.salesUnitId} not found`);
        }
      }
    }

    // For other departments, validate if data is provided
    if (departmentName === 'HR' && dto.departmentData && departmentDataKeys.length > 0 && !dto.departmentData.hr) {
      throw new BadRequestException(`Department data mismatch. Selected department is 'HR' but no HR data provided.`);
    }

    if (departmentName === 'Marketing' && dto.departmentData && departmentDataKeys.length > 0 && !dto.departmentData.marketing) {
      throw new BadRequestException(`Department data mismatch. Selected department is 'Marketing' but no Marketing data provided.`);
    }

    if (departmentName === 'Production' && dto.departmentData && departmentDataKeys.length > 0 && !dto.departmentData.production) {
      throw new BadRequestException(`Department data mismatch. Selected department is 'Production' but no Production data provided.`);
    }

    if (departmentName === 'Accounts' && dto.departmentData && departmentDataKeys.length > 0 && !dto.departmentData.accountant) {
      throw new BadRequestException(`Department data mismatch. Selected department is 'Accounts' but no Accountant data provided.`);
    }

    // Additional validation for Sales department (already done above)
    // This section is now handled in CRITICAL VALIDATION 3

    // Validate marketing unit if provided
    if (departmentName === 'Marketing' && dto.departmentData?.marketing?.marketingUnitId) {
      const marketingUnit = await this.prisma.marketingUnit.findUnique({
        where: { id: dto.departmentData.marketing.marketingUnitId },
      });
      if (!marketingUnit) {
        throw new NotFoundException(`Marketing Unit with ID ${dto.departmentData.marketing.marketingUnitId} not found`);
      }
    }

    // Validate production unit if provided
    if (departmentName === 'Production' && dto.departmentData?.production?.productionUnitId) {
      const productionUnit = await this.prisma.productionUnit.findUnique({
        where: { id: dto.departmentData.production.productionUnitId },
      });
      if (!productionUnit) {
        throw new NotFoundException(`Production Unit with ID ${dto.departmentData.production.productionUnitId} not found`);
      }
    }

    // OPTIMIZATION: Fix all sequences BEFORE transaction (reduces transaction time)
    try {
      await this.prisma.$executeRaw`SELECT setval('employees_emp_id_seq', (SELECT COALESCE(MAX(emp_id), 0) + 1 FROM employees))`;
      await this.prisma.$executeRaw`SELECT setval('hr_hr_id_seq', (SELECT COALESCE(MAX(hr_id), 0) + 1 FROM hr))`;
      await this.prisma.$executeRaw`SELECT setval('sales_departments_sales_department_id_seq', (SELECT COALESCE(MAX(sales_department_id), 0) + 1 FROM sales_departments))`;
      await this.prisma.$executeRaw`SELECT setval('marketing_marketing_id_seq', (SELECT COALESCE(MAX(marketing_id), 0) + 1 FROM marketing))`;
      await this.prisma.$executeRaw`SELECT setval('production_production_id_seq', (SELECT COALESCE(MAX(production_id), 0) + 1 FROM production))`;
      await this.prisma.$executeRaw`SELECT setval('accountants_accountant_id_seq', (SELECT COALESCE(MAX(accountant_id), 0) + 1 FROM accountants))`;
      await this.prisma.$executeRaw`SELECT setval('accounts_account_id_seq', (SELECT COALESCE(MAX(account_id), 0) + 1 FROM accounts))`;
    } catch (error) {
      this.logger.warn('Could not reset all sequences, continuing with creation');
    }

    try {
      // Use optimized transaction - only critical operations inside
      const result = await this.prisma.$transaction(async (tx) => {

        // Step 1: Create Employee
        const employee = await tx.employee.create({
          data: {
            firstName: dto.employee.firstName,
            lastName: dto.employee.lastName,
            email: dto.employee.email,
            phone: dto.employee.phone,
            gender: dto.employee.gender,
            cnic: dto.employee.cnic,
            departmentId: dto.employee.departmentId,
            roleId: dto.employee.roleId,
            managerId: dto.employee.managerId,
            teamLeadId: dto.employee.teamLeadId,
            address: dto.employee.address,
            maritalStatus: dto.employee.maritalStatus,
            status: dto.employee.status || 'active',
            startDate: dto.employee.startDate ? new Date(dto.employee.startDate) : null,
            endDate: dto.employee.endDate ? new Date(dto.employee.endDate) : null,
            modeOfWork: dto.employee.modeOfWork,
            remoteDaysAllowed: dto.employee.remoteDaysAllowed,
            dob: dto.employee.dob ? new Date(dto.employee.dob) : null,
            emergencyContact: dto.employee.emergencyContact,
            shiftStart: dto.employee.shiftStart,
            shiftEnd: dto.employee.shiftEnd,
            employmentType: dto.employee.employmentType,
            dateOfConfirmation: dto.employee.dateOfConfirmation ? new Date(dto.employee.dateOfConfirmation) : null,
            periodType: dto.employee.periodType,
            passwordHash: await bcrypt.hash(dto.employee.passwordHash, 10),
            bonus: dto.employee.bonus,
          },
        });

        this.logger.log(`Employee ${employee.id} created successfully in transaction`);

        // Step 2: Create Department-Specific Record
        let departmentRecord: any = null;

        if (departmentName === 'HR' && dto.departmentData?.hr) {
          // Apply defaults for HR permissions (false if not provided)
          departmentRecord = await tx.hR.create({
            data: {
              employeeId: employee.id,
              attendancePermission: dto.departmentData.hr.attendancePermission ?? false,
              salaryPermission: dto.departmentData.hr.salaryPermission ?? false,
              commissionPermission: dto.departmentData.hr.commissionPermission ?? false,
              employeeAddPermission: dto.departmentData.hr.employeeAddPermission ?? false,
              terminationsHandle: dto.departmentData.hr.terminationsHandle ?? false,
              monthlyRequestApprovals: dto.departmentData.hr.monthlyRequestApprovals ?? false,
              targetsSet: dto.departmentData.hr.targetsSet ?? false,
              bonusesSet: dto.departmentData.hr.bonusesSet ?? false,
              shiftTimingSet: dto.departmentData.hr.shiftTimingSet ?? false,
            },
          });
          this.logger.log(`HR record created for employee ${employee.id}`);
        } else if (departmentName === 'Sales' && dto.departmentData?.sales) {
          // Apply defaults for Sales department (0 for optional numeric fields)
          departmentRecord = await tx.salesDepartment.create({
            data: {
              employeeId: employee.id,
              salesUnitId: dto.departmentData.sales.salesUnitId,
              commissionRate: dto.departmentData.sales.commissionRate,
              withholdCommission: dto.departmentData.sales.withholdCommission,
              withholdFlag: dto.departmentData.sales.withholdFlag,
              targetAmount: dto.departmentData.sales.targetAmount ?? 0,
              salesBonus: dto.departmentData.sales.salesBonus ?? 0,
              leadsClosed: dto.departmentData.sales.leadsClosed ?? 0,
              salesAmount: dto.departmentData.sales.salesAmount ?? 0,
              commissionAmount: dto.departmentData.sales.commissionAmount ?? 0,
              chargebackDeductions: dto.departmentData.sales.chargebackDeductions ?? 0,
              refundDeductions: dto.departmentData.sales.refundDeductions ?? 0,
            },
          });
          this.logger.log(`Sales department record created for employee ${employee.id}`);
        } else if (departmentName === 'Marketing' && dto.departmentData?.marketing) {
          // Apply defaults for Marketing department
          departmentRecord = await tx.marketing.create({
            data: {
              employeeId: employee.id,
              marketingUnitId: dto.departmentData.marketing.marketingUnitId,
              platformFocus: dto.departmentData.marketing.platformFocus,
              totalCampaignsRun: dto.departmentData.marketing.totalCampaignsRun ?? 0,
            },
          });
          this.logger.log(`Marketing record created for employee ${employee.id}`);
        } else if (departmentName === 'Production' && dto.departmentData?.production) {
          // Apply defaults for Production department
          departmentRecord = await tx.production.create({
            data: {
              employeeId: employee.id,
              specialization: dto.departmentData.production.specialization,
              productionUnitId: dto.departmentData.production.productionUnitId,
              projectsCompleted: dto.departmentData.production.projectsCompleted ?? 0,
            },
          });
          this.logger.log(`Production record created for employee ${employee.id}`);
        } else if (departmentName === 'Accounts' && dto.departmentData?.accountant) {
          // Apply defaults for Accountant permissions (false if not provided)
          departmentRecord = await tx.accountant.create({
            data: {
              employeeId: employee.id,
              liabilitiesPermission: dto.departmentData.accountant.liabilitiesPermission ?? false,
              salaryPermission: dto.departmentData.accountant.salaryPermission ?? false,
              salesPermission: dto.departmentData.accountant.salesPermission ?? false,
              invoicesPermission: dto.departmentData.accountant.invoicesPermission ?? false,
              expensesPermission: dto.departmentData.accountant.expensesPermission ?? false,
              assetsPermission: dto.departmentData.accountant.assetsPermission ?? false,
              revenuesPermission: dto.departmentData.accountant.revenuesPermission ?? false,
            },
          });
          this.logger.log(`Accountant record created for employee ${employee.id}`);
        }

        // Step 3: Create Bank Account Record (optional)
        let bankAccountRecord: any = null;
        if (dto.bankAccount) {
          bankAccountRecord = await tx.account.create({
            data: {
              employeeId: employee.id,
              accountTitle: dto.bankAccount.accountTitle,
              bankName: dto.bankAccount.bankName,
              ibanNumber: dto.bankAccount.ibanNumber,
              baseSalary: dto.bankAccount.baseSalary,
            },
          });
          this.logger.log(`Bank account record created for employee ${employee.id}`);
        }

        // Return only essential data from transaction
        return {
          employeeId: employee.id,
          employeeFirstName: employee.firstName,
          employeeLastName: employee.lastName,
          employeeEmail: employee.email,
        };
      }, {
        timeout: 10000, // 10 seconds timeout - optimized transaction
      });

      // OPTIMIZATION: Move HR log creation OUTSIDE transaction (non-critical for atomicity)
      try {
        await this.createHrLog(
          hrEmployeeId, 
          'employee_created', 
          result.employeeId, 
          `Complete employee record created for ${result.employeeFirstName} ${result.employeeLastName} (${result.employeeEmail}) in ${departmentName} department`
        );
      } catch (error) {
        this.logger.warn(`Failed to create HR log: ${error.message}`);
      }

      // OPTIMIZATION: Fetch complete employee data OUTSIDE transaction (faster)
      const completeEmployee = await this.prisma.employee.findUnique({
        where: { id: result.employeeId },
        include: {
          department: true,
          role: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          hr: true,
          salesDepartment: true,
          marketingRecords: true,
          production: true,
          accountant: true,
          accounts: true,
        },
      });

      this.logger.log(`Complete employee creation successful for ID ${result.employeeId}`);

      return {
        status: 'success',
        message: 'Employee created successfully with all related records',
        data: {
          employee: completeEmployee,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create complete employee: ${error.message}`);
      throw new BadRequestException(`Failed to create employee: ${error.message}`);
    }
  }

  /**
   * Create a new employee (original method - kept for backward compatibility)
   */
  async createEmployee(dto: CreateEmployeeDto, hrEmployeeId: number) {
    // Check if email already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (existingEmployee) {
      throw new BadRequestException(`Employee with email ${dto.email} already exists`);
    }

    // Fix sequence issue if it exists
    try {
      await this.prisma.$executeRaw`SELECT setval('employees_emp_id_seq', (SELECT COALESCE(MAX(emp_id), 0) + 1 FROM employees))`;
    } catch (error) {
      this.logger.warn('Could not reset employee sequence, continuing with creation');
    }

    // Validate department exists
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
    }

    // Validate role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
    }

    // Validate manager if provided
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${dto.managerId} not found`);
      }
    }

    // Validate team lead if provided
    if (dto.teamLeadId) {
      const teamLead = await this.prisma.employee.findUnique({
        where: { id: dto.teamLeadId },
      });

      if (!teamLead) {
        throw new NotFoundException(`Team Lead with ID ${dto.teamLeadId} not found`);
      }
    }

    // Validate role hierarchy constraints
    await this.validateRoleHierarchy(
      dto.roleId,
      dto.managerId,
      dto.teamLeadId
    );

    try {
      const employee = await this.prisma.employee.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          gender: dto.gender,
          cnic: dto.cnic,
          departmentId: dto.departmentId,
          roleId: dto.roleId,
          managerId: dto.managerId,
          teamLeadId: dto.teamLeadId,
          address: dto.address,
          maritalStatus: dto.maritalStatus,
          status: dto.status || 'active',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          modeOfWork: dto.modeOfWork,
          remoteDaysAllowed: dto.remoteDaysAllowed,
          dob: dto.dob ? new Date(dto.dob) : null,
          emergencyContact: dto.emergencyContact,
          shiftStart: dto.shiftStart,
          shiftEnd: dto.shiftEnd,
          employmentType: dto.employmentType,
          dateOfConfirmation: dto.dateOfConfirmation ? new Date(dto.dateOfConfirmation) : null,
          periodType: dto.periodType,
          passwordHash: await bcrypt.hash(dto.passwordHash, 10),
          bonus: dto.bonus,
        },
        include: {
          department: true,
          role: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry
      await this.createHrLog(hrEmployeeId, 'employee_created', employee.id, `New employee ${employee.firstName} ${employee.lastName} created with email ${employee.email} in department ${employee.department.name}`);

      this.logger.log(`Employee ${employee.id} created successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`);
      throw new BadRequestException(`Failed to create employee: ${error.message}`);
    }
  }

  /**
   * Get all employees with filters and pagination
   */
  async getEmployees(filters: GetEmployeesDto) {
    const { departmentId, roleId, status, gender, employmentType, modeOfWork, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.status = status;
    }

    if (gender) {
      where.gender = gender;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (modeOfWork) {
      where.modeOfWork = modeOfWork;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [employees, total] = await Promise.all([
        this.prisma.employee.findMany({
          where,
          include: {
            department: true,
            role: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            teamLead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.employee.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        employees,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to get employees: ${error.message}`);
      throw new BadRequestException(`Failed to get employees: ${error.message}`);
    }
  }

  /**
   * Get a specific employee by ID
   */
  async getEmployeeById(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        teamLead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  /**
   * Update an employee
   */
  async updateEmployee(id: number, dto: UpdateEmployeeDto, hrEmployeeId: number) {
    // Check if employee exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Check if email is being updated and if it already exists
    if (dto.email && dto.email !== existingEmployee.email) {
      const emailExists = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new BadRequestException(`Employee with email ${dto.email} already exists`);
      }
    }

    // Validate department if being updated
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
      }
    }

    // Validate role if being updated
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
      }
    }

    // Validate manager if being updated
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${dto.managerId} not found`);
      }
    }

    // Validate team lead if being updated
    if (dto.teamLeadId) {
      const teamLead = await this.prisma.employee.findUnique({
        where: { id: dto.teamLeadId },
      });

      if (!teamLead) {
        throw new NotFoundException(`Team Lead with ID ${dto.teamLeadId} not found`);
      }
    }

    // Validate role hierarchy constraints if role is being updated
    if (dto.roleId) {
      await this.validateRoleHierarchy(
        dto.roleId,
        dto.managerId,
        dto.teamLeadId
      );
    }

    try {
      const updateData: any = {};

      // Only include fields that are provided
      if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
      if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.phone !== undefined) updateData.phone = dto.phone;
      if (dto.gender !== undefined) updateData.gender = dto.gender;
      if (dto.cnic !== undefined) updateData.cnic = dto.cnic;
      if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId;
      if (dto.roleId !== undefined) updateData.roleId = dto.roleId;
      if (dto.managerId !== undefined) updateData.managerId = dto.managerId;
      if (dto.teamLeadId !== undefined) updateData.teamLeadId = dto.teamLeadId;
      if (dto.address !== undefined) updateData.address = dto.address;
      if (dto.maritalStatus !== undefined) updateData.maritalStatus = dto.maritalStatus;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
      if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
      if (dto.modeOfWork !== undefined) updateData.modeOfWork = dto.modeOfWork;
      if (dto.remoteDaysAllowed !== undefined) updateData.remoteDaysAllowed = dto.remoteDaysAllowed;
      if (dto.dob !== undefined) updateData.dob = dto.dob ? new Date(dto.dob) : null;
      if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact;
      if (dto.shiftStart !== undefined) updateData.shiftStart = dto.shiftStart;
      if (dto.shiftEnd !== undefined) updateData.shiftEnd = dto.shiftEnd;
      if (dto.employmentType !== undefined) updateData.employmentType = dto.employmentType;
      if (dto.dateOfConfirmation !== undefined) updateData.dateOfConfirmation = dto.dateOfConfirmation ? new Date(dto.dateOfConfirmation) : null;
      if (dto.periodType !== undefined) updateData.periodType = dto.periodType;
      if (dto.passwordHash !== undefined) updateData.passwordHash = await bcrypt.hash(dto.passwordHash, 10);
      if (dto.bonus !== undefined) updateData.bonus = dto.bonus;

      const employee = await this.prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          role: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry
      const updatedFields = Object.keys(updateData).join(', ');
      await this.createHrLog(hrEmployeeId, 'employee_updated', employee.id, `Employee ${employee.firstName} ${employee.lastName} updated - Fields changed: ${updatedFields}`);

      this.logger.log(`Employee ${id} updated successfully`);
      return employee;
    } catch (error) {
      this.logger.error(`Failed to update employee ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update employee: ${error.message}`);
    }
  }

  /**
   * Delete an employee and all related records
   */
  async deleteEmployee(id: number, hrEmployeeId: number) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Check if employee is already deleted (to prevent duplicate operations)
    const existingDeletionLog = await this.prisma.hRLog.findFirst({
      where: {
        affectedEmployeeId: id,
        actionType: 'employee_deleted'
      }
    });

    if (existingDeletionLog) {
      throw new BadRequestException(`Employee ${id} has already been deleted`);
    }

    try {
      // Use a transaction to ensure all related records are deleted atomically
      await this.prisma.$transaction(async (tx) => {
        // Delete all related records first (in reverse order of dependencies)
        
        // Delete attendance records
        await tx.attendance.deleteMany({
          where: { employeeId: id },
        });

        // Delete attendance logs
        await tx.attendanceLog.deleteMany({
          where: { employeeId: id },
        });

        // Delete monthly attendance summaries
        await tx.monthlyAttendanceSummary.deleteMany({
          where: { empId: id },
        });

        // Delete late logs
        await tx.lateLog.deleteMany({
          where: { empId: id },
        });

        // Delete half day logs
        await tx.halfDayLog.deleteMany({
          where: { empId: id },
        });

        // Delete leave logs
        await tx.leaveLog.deleteMany({
          where: { empId: id },
        });

        // Delete HR logs where this employee is affected (but keep creation and update logs for audit trail)
        // We'll create the deletion log before deleting other HR logs
        await tx.hRLog.deleteMany({
          where: { 
            affectedEmployeeId: id,
            actionType: { 
              notIn: ['employee_created', 'employee_updated'] // Keep creation and update logs, deletion log will be created separately
            }
          },
        });

        // Delete HR record if exists
        await tx.hR.deleteMany({
          where: { employeeId: id },
        });

        // Delete accountant record if exists
        await tx.accountant.deleteMany({
          where: { employeeId: id },
        });

        // Delete accounts
        await tx.account.deleteMany({
          where: { employeeId: id },
        });

        // Delete net salary logs
        await tx.netSalaryLog.deleteMany({
          where: { employeeId: id },
        });

        // Delete sales department records
        await tx.salesDepartment.deleteMany({
          where: { employeeId: id },
        });

        // Delete marketing records
        await tx.marketing.deleteMany({
          where: { employeeId: id },
        });

        // Delete production records
        await tx.production.deleteMany({
          where: { employeeId: id },
        });

        // Delete project logs
        await tx.projectLog.deleteMany({
          where: { developerId: id },
        });

        // Delete project tasks
        await tx.projectTask.deleteMany({
          where: { 
            OR: [
              { assignedBy: id },
              { assignedTo: id }
            ]
          },
        });

        // Delete lead comments
        await tx.leadComment.deleteMany({
          where: { commentBy: id },
        });

        // Delete lead outcome history
        await tx.leadOutcomeHistory.deleteMany({
          where: { changedBy: id },
        });

        // Delete cracked leads
        await tx.crackedLead.deleteMany({
          where: { closedBy: id },
        });

        // Delete refunds
        await tx.refund.deleteMany({
          where: { refundedBy: id },
        });

        // Delete chargebacks
        await tx.chargeback.deleteMany({
          where: { handledBy: id },
        });

        // Delete transactions
        await tx.transaction.deleteMany({
          where: { employeeId: id },
        });

        // Delete expenses
        await tx.expense.deleteMany({
          where: { createdBy: id },
        });

        // Delete revenues
        await tx.revenue.deleteMany({
          where: { createdBy: id },
        });

        // Delete assets
        await tx.asset.deleteMany({
          where: { createdBy: id },
        });

        // Delete liabilities
        await tx.liability.deleteMany({
          where: { createdBy: id },
        });

        // Delete vendors
        await tx.vendor.deleteMany({
          where: { createdBy: id },
        });

        // Delete clients
        await tx.client.deleteMany({
          where: { createdBy: id },
        });

        // Delete access logs
        await tx.accessLog.deleteMany({
          where: { employeeId: id },
        });

        // Delete project chats
        await tx.projectChat.deleteMany({
          where: { 
            OR: [
              { transferredFrom: id },
              { transferredTo: id }
            ]
          },
        });

        // Delete chat participants
        await tx.chatParticipant.deleteMany({
          where: { employeeId: id },
        });

        // Delete chat messages
        await tx.chatMessage.deleteMany({
          where: { senderId: id },
        });

        // Delete meetings
        await tx.meeting.deleteMany({
          where: { employeeId: id },
        });

        // Delete notifications
        await tx.notification.deleteMany({
          where: { 
            OR: [
              { sentTo: id },
              { sentBy: id }
            ]
          },
        });

        // Delete HR requests
        await tx.hrRequest.deleteMany({
          where: { 
            OR: [
              { empId: id },
              { assignedTo: id }
            ]
          },
        });

        // Delete complaints
        await tx.complaint.deleteMany({
          where: { 
            OR: [
              { raisedBy: id },
              { againstEmployeeId: id },
              { assignedTo: id }
            ]
          },
        });

        // Delete reminders
        await tx.reminders.deleteMany({
          where: { empId: id },
        });

        // Delete client payments
        await tx.clientPayment.deleteMany({
          where: { paymentPhase: id },
        });

        // Delete archive leads
        await tx.archiveLead.deleteMany({
          where: { assignedTo: id },
        });

        // Update projects to remove employee references
        await tx.project.updateMany({
          where: { salesRepId: id },
          data: { salesRepId: null },
        });

        // Update teams to remove employee references
        await tx.team.updateMany({
          where: { teamLeadId: id },
          data: { teamLeadId: null },
        });

        // Update departments to remove manager reference
        await tx.department.updateMany({
          where: { managerId: id },
          data: { managerId: null },
        });

        // Update sales units to remove head reference
        await tx.salesUnit.updateMany({
          where: { headId: id },
          data: { headId: null },
        });

        // Update production units to remove head reference
        await tx.productionUnit.updateMany({
          where: { headId: id },
          data: { headId: null },
        });

        // Update marketing units to remove head reference
        await tx.marketingUnit.updateMany({
          where: { headId: id },
          data: { headId: null },
        });

        // Update other employees to remove manager/team lead references
        await tx.employee.updateMany({
          where: { managerId: id },
          data: { managerId: null },
        });

        await tx.employee.updateMany({
          where: { teamLeadId: id },
          data: { teamLeadId: null },
        });

        // Create HR log entry BEFORE deleting the employee record
        // This ensures the log is created within the transaction and won't be lost
        const hrRecord = await tx.hR.findUnique({
          where: { employeeId: hrEmployeeId },
        });

        if (hrRecord) {
          await tx.hRLog.create({
            data: {
              hrId: hrRecord.id,
              actionType: 'employee_deleted',
              affectedEmployeeId: id,
              description: `Employee ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, Email: ${employee.email}) permanently deleted from all systems`,
            },
          });
          this.logger.log(`HR deletion log created for employee ${id}`);
        } else {
          this.logger.warn(`No HR record found for HR employee ${hrEmployeeId}, skipping deletion log creation`);
          // Still proceed with deletion even if log creation fails
        }

        // Finally, delete the employee record
        await tx.employee.delete({
          where: { id },
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      this.logger.log(`Employee ${id} and all related records deleted successfully`);
      return { message: 'Employee and all related records deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete employee ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to delete employee: ${error.message}`);
    }
  }

  /**
   * Update employee bonus
   * 
   * This method updates the bonus amount for a specific employee.
   * It validates that the employee exists and creates an HR log entry.
   * 
   * @param id - Employee ID
   * @param bonus - New bonus amount
   * @param hrEmployeeId - ID of the HR employee making the change
   * @returns Updated employee data
   */
  async updateBonus(id: number, bonus: number, hrEmployeeId: number) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Get HR employee details for logging
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    try {
      // Update the employee's bonus
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: { bonus },
        include: {
          department: true,
          role: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry
      const logDescription = `Bonus updated for employee ${employee.firstName} ${employee.lastName} from ${employee.bonus || 0} to ${bonus}`;
      await this.createHrLog(hrEmployeeId, 'bonus_updated', id, logDescription);

      this.logger.log(`Bonus updated for employee ${id} from ${employee.bonus || 0} to ${bonus}`);

      return updatedEmployee;
    } catch (error) {
      this.logger.error(`Failed to update bonus for employee ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update bonus: ${error.message}`);
    }
  }

  /**
   * Update employee shift times
   */
  async updateShift(id: number, shiftData: { shift_start?: string; shift_end?: string }, hrEmployeeId: number) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Get HR employee details for logging
    const hrEmployee = await this.prisma.employee.findUnique({
      where: { id: hrEmployeeId },
    });

    if (!hrEmployee) {
      throw new NotFoundException(`HR Employee with ID ${hrEmployeeId} not found`);
    }

    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Validate that at least one shift time is provided
    if (!shiftData.shift_start && !shiftData.shift_end) {
      throw new BadRequestException('At least one shift time (shift_start or shift_end) must be provided');
    }

    try {
      // Prepare update data
      const updateData: { shiftStart?: string; shiftEnd?: string } = {};
      if (shiftData.shift_start !== undefined) {
        updateData.shiftStart = shiftData.shift_start;
      }
      if (shiftData.shift_end !== undefined) {
        updateData.shiftEnd = shiftData.shift_end;
      }

      // Update the employee's shift times
      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          role: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create HR log entry
      const changes: string[] = [];
      if (shiftData.shift_start !== undefined) {
        changes.push(`shift_start: ${employee.shiftStart || 'N/A'} → ${shiftData.shift_start}`);
      }
      if (shiftData.shift_end !== undefined) {
        changes.push(`shift_end: ${employee.shiftEnd || 'N/A'} → ${shiftData.shift_end}`);
      }

      const logDescription = `Shift times updated for employee ${employee.firstName} ${employee.lastName} - Changes: ${changes.join(', ')}`;
      await this.createHrLog(hrEmployeeId, 'shift_updated', id, logDescription);

      this.logger.log(`Shift times updated for employee ${id}: ${changes.join(', ')}`);

      return updatedEmployee;
    } catch (error) {
      this.logger.error(`Failed to update shift times for employee ${id}: ${error.message}`);
      throw new BadRequestException(`Failed to update shift times: ${error.message}`);
    }
  }

  /**
   * Get comprehensive employee statistics
   */
  async getEmployeeStatistics(): Promise<EmployeeStatisticsDto> {
    try {
      // Get all employees with necessary relations
      const employees = await this.prisma.employee.findMany({
        include: {
          department: true,
          role: true,
        },
      });

      if (employees.length === 0) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          terminated: 0,
          byDepartment: {},
          byRole: {},
          byGender: {},
          byEmploymentType: {},
          byModeOfWork: {},
          byMaritalStatus: {},
          averageAge: 0,
          averageBonus: 0,
          thisMonth: {
            new: 0,
            active: 0,
            inactive: 0,
          },
        };
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

      // Basic counts
      const activeEmployees = employees.filter(emp => emp.status === 'active');
      const terminatedEmployees = employees.filter(emp => emp.status === 'terminated');
      const inactiveEmployees = employees.filter(emp => emp.status === 'inactive');

      // New employees this month (employees that have start date of this month)
      const newThisMonth = employees.filter(emp => {
        if (!emp.startDate) return false;
        const startDate = new Date(emp.startDate);
        return startDate >= firstDayOfMonth;
      });

      // Department breakdown
      const byDepartment = employees.reduce((acc, emp) => {
        const deptName = emp.department?.name || 'Unknown';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Role breakdown
      const byRole = employees.reduce((acc, emp) => {
        const roleName = emp.role?.name || 'Unknown';
        acc[roleName] = (acc[roleName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Gender breakdown
      const byGender = employees.reduce((acc, emp) => {
        const gender = emp.gender || 'Unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Employment type breakdown
      const byEmploymentType = employees.reduce((acc, emp) => {
        const type = emp.employmentType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Mode of work breakdown
      const byModeOfWork = employees.reduce((acc, emp) => {
        const mode = emp.modeOfWork || 'Unknown';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Average age calculation
      const validAges = employees
        .filter(emp => emp.dob)
        .map(emp => {
          const dob = new Date(emp.dob!);
          const age = now.getFullYear() - dob.getFullYear();
          const monthDiff = now.getMonth() - dob.getMonth();
          return monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate()) ? age - 1 : age;
        });

      const averageAge = validAges.length > 0 
        ? Math.round(validAges.reduce((sum, age) => sum + age, 0) / validAges.length)
        : 0;

      // Average bonus calculation
      const validBonuses = employees
        .filter(emp => emp.bonus && emp.bonus > 0)
        .map(emp => emp.bonus!);

      const averageBonus = validBonuses.length > 0
        ? Math.round(validBonuses.reduce((sum, bonus) => sum + bonus, 0) / validBonuses.length)
        : 0;

      // Marital status breakdown
      const byMaritalStatus = employees.reduce((acc, emp) => {
        const status = emp.maritalStatus ? 'Married' : 'Single';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statistics: EmployeeStatisticsDto = {
        total: employees.length,
        active: activeEmployees.length,
        inactive: inactiveEmployees.length, // Changed to specifically count terminated employees
        terminated: terminatedEmployees.length,
        byDepartment,
        byRole,
        byGender,
        byEmploymentType,
        byModeOfWork,
        byMaritalStatus,
        averageAge,
        averageBonus,
        thisMonth: {
          new: newThisMonth.length,
          active: newThisMonth.filter(emp => emp.status === 'active').length,
          inactive: newThisMonth.filter(emp => emp.status === 'terminated').length, // Changed to specifically count terminated employees
        },
      };

      this.logger.log('Employee statistics calculated successfully');
      return statistics;
    } catch (error) {
      this.logger.error(`Failed to get employee statistics: ${error.message}`);
      throw new BadRequestException(`Failed to get employee statistics: ${error.message}`);
    }
  }

  /**
   * Get HR logs statistics
   */
  async getHrLogsStats(): Promise<HrLogsStatsResponseDto> {
    try {
      const now = new Date();
      
      // Get start of today (00:00:00)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get start of this week (Monday)
      const startOfWeek = new Date(startOfToday);
      const dayOfWeek = startOfToday.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
      startOfWeek.setDate(startOfToday.getDate() - daysToMonday);
      
      // Get start of this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalLogs, todayLogs, thisWeekLogs, thisMonthLogs] = await Promise.all([
        // Total logs
        this.prisma.hRLog.count(),
        
        // Today's logs
        this.prisma.hRLog.count({
          where: {
            createdAt: {
              gte: startOfToday,
            },
          },
        }),
        
        // This week's logs
        this.prisma.hRLog.count({
          where: {
            createdAt: {
              gte: startOfWeek,
            },
          },
        }),
        
        // This month's logs
        this.prisma.hRLog.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        }),
      ]);

      console.log('HR Logs Stats Debug:', {
        totalLogs,
        todayLogs,
        thisWeekLogs,
        thisMonthLogs,
        startOfToday: startOfToday.toISOString(),
        startOfWeek: startOfWeek.toISOString(),
        startOfMonth: startOfMonth.toISOString(),
      });

      return {
        totalLogs,
        todayLogs,
        thisWeekLogs,
        thisMonthLogs,
      };
    } catch (error) {
      this.logger.error(`Failed to get HR logs stats: ${error.message}`);
      throw new BadRequestException(`Failed to get HR logs stats: ${error.message}`);
    }
  }

  /**
   * Helper method to create HR log entries
   */
  private async createHrLog(hrEmployeeId: number, actionType: string, affectedEmployeeId: number, description: string) {
    try {
      const hrRecord = await this.prisma.hR.findUnique({
        where: { employeeId: hrEmployeeId },
      });

      if (hrRecord) {
        await this.prisma.hRLog.create({
          data: {
            hrId: hrRecord.id,
            actionType,
            affectedEmployeeId,
            description,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to create HR log: ${error.message}`);
      // Don't fail the main operation if log creation fails
    }
  }

  async getHrLogsForExport(query: any) {
    const { 
      hr_id, 
      action_type, 
      affected_employee_id, 
      start_date, 
      end_date,
      created_start,
      created_end,
      updated_start,
      updated_end,
    } = query;

    // Build where clause (same logic as getHrLogs but without pagination)
    const where: any = {};

    if (hr_id) {
      where.hrId = hr_id;
    }

    if (action_type) {
      where.actionType = action_type;
    }

    if (affected_employee_id) {
      where.affectedEmployeeId = affected_employee_id;
    }

    // Handle date filtering - prioritize specific date parameters over generic ones
    if (created_start || created_end) {
      where.createdAt = {};
      if (created_start) {
        where.createdAt.gte = new Date(created_start);
      }
      if (created_end) {
        where.createdAt.lte = new Date(created_end);
      }
    } else if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = new Date(start_date);
      }
      if (end_date) {
        where.createdAt.lte = new Date(end_date);
      }
    }

    if (updated_start || updated_end) {
      where.updatedAt = {};
      if (updated_start) {
        where.updatedAt.gte = new Date(updated_start);
      }
      if (updated_end) {
        where.updatedAt.lte = new Date(updated_end);
      }
    }

    return this.prisma.hRLog.findMany({
      where,
      include: {
        hr: {
          select: {
            id: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        affectedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  convertHrLogsToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    // Define CSV headers
    const headers = [
      'ID',
      'HR Employee ID',
      'HR Employee Name',
      'HR Employee Email',
      'HR Department',
      'Action Type',
      'Affected Employee ID',
      'Affected Employee Name',
      'Affected Employee Email',
      'Affected Employee Department',
      'Description',
      'Created At',
      'Updated At',
    ];

    // Convert data to CSV rows
    const rows = data.map(log => [
      log.id,
      log.hr?.employee?.id || 'N/A',
      log.hr?.employee ? `${log.hr.employee.firstName} ${log.hr.employee.lastName}` : 'N/A',
      log.hr?.employee?.email || 'N/A',
      log.hr?.employee?.department?.name || 'N/A',
      log.actionType,
      log.affectedEmployeeId,
      log.affectedEmployee ? `${log.affectedEmployee.firstName} ${log.affectedEmployee.lastName}` : 'N/A',
      log.affectedEmployee?.email || 'N/A',
      log.affectedEmployee?.department?.name || 'N/A',
      log.description,
      log.createdAt ? new Date(log.createdAt).toISOString() : 'N/A',
      log.updatedAt ? new Date(log.updatedAt).toISOString() : 'N/A',
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Combine headers and rows
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    return csvContent;
  }
}
