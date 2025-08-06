import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { FinanceService } from '../../../finance/finance.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { GetEmployeesDto } from '../dto/get-employees.dto';

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
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          endDate: parsedDate,
          status: 'terminated',
        },
      });

      await this.financeService.calculateSalaryManual(employeeId);

      // Create HR log entry
      const logDescription = description ||
        `Employee ${employee.firstName} ${employee.lastName} terminated on ${terminationDate}`;
      
      await this.createHrLog(hrEmployeeId, 'employee_terminated', employeeId, logDescription);

      this.logger.log(
        `Employee ${employeeId} terminated on ${terminationDate} and salary processed.`,
      );
    } catch (error) {
      this.logger.error(`Failed to terminate employee ${employeeId}: ${error.message}`);
      throw new BadRequestException(`Failed to terminate employee: ${error.message}`);
    }
  }

  async getHrLogs(hrEmployeeId: number) {
    // Get HR record
    const hrRecord = await this.prisma.hR.findUnique({
      where: { employeeId: hrEmployeeId },
    });

    if (!hrRecord) {
      throw new NotFoundException(`HR record not found for employee ${hrEmployeeId}`);
    }

    // Get HR logs with related data
    const logs = await this.prisma.hRLog.findMany({
      where: { hrId: hrRecord.id },
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
      orderBy: { createdAt: 'desc' },
    });

    return logs;
  }

  /**
   * Create a new employee
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
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          modeOfWork: dto.modeOfWork,
          remoteDaysAllowed: dto.remoteDaysAllowed,
          dob: dto.dob ? new Date(dto.dob) : null,
          emergencyContact: dto.emergencyContact,
          shiftStart: dto.shiftStart,
          shiftEnd: dto.shiftEnd,
          employmentType: dto.employmentType,
          dateOfConfirmation: dto.dateOfConfirmation ? new Date(dto.dateOfConfirmation) : null,
          periodType: dto.periodType,
          passwordHash: dto.passwordHash,
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
    const { departmentId, roleId, status, employmentType, modeOfWork, search, page = 1, limit = 10 } = filters;
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
      if (dto.passwordHash !== undefined) updateData.passwordHash = dto.passwordHash;
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
}
