import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricGrid(userId: number) {
    // Get user with department and role
    const user = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: {
        department: { select: { name: true } },
        role: { select: { name: true } },
        teamsAsLead: { select: { id: true } }
      }
    });

    if (!user) throw new Error('User not found');

    const dept = user.department.name;
    const role = user.role.name;

    // Return cards based on department
    if (dept === 'Sales') return this.getSalesCards(user, role);
    if (dept === 'HR') return this.getHrCards(user);
    if (dept === 'Production') return this.getProductionCards(user, role);
    if (dept === 'Accounts') return this.getAccountantCards();

    return { department: dept, role, cards: [] };
  }

  // SALES
  private async getSalesCards(user: any, role: string) {
    let where: any = {};
    if (role === 'unit_head') where = { salesUnit: { headId: user.id } };
    else if (role === 'team_lead') where = { assignedTo: { teamLeadId: user.id } };
    else if (role !== 'dep_manager') where = { assignedToId: user.id };

    const dateRanges = this.getDateRanges();

    // Current month data
    const currentMonthWhere = { ...where, createdAt: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd } };
    const prevMonthWhere = { ...where, createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } };

    const [total, active, cracked, revenue, commission, prevTotal, prevCracked, prevRevenue] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.crackedLead.count({ where: { lead: where } }),
      this.prisma.crackedLead.aggregate({ where: { lead: where }, _sum: { amount: true } }),
      this.prisma.salesDepartment.findFirst({ where: { employeeId: user.id }, select: { commissionAmount: true } }),
      // Previous month data - compare same period
      this.prisma.lead.count({ where: prevMonthWhere }),
      this.prisma.crackedLead.count({ where: { lead: prevMonthWhere, crackedAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.crackedLead.aggregate({ where: { lead: prevMonthWhere, crackedAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } })
    ]);

    const conversionRate = total > 0 ? ((cracked / total) * 100) : 0;
    const prevConversionRate = prevTotal > 0 ? ((prevCracked / prevTotal) * 100) : 0;

    return {
      department: 'Sales',
      role,
      cards: [
        { 
          id: 1, 
          title: 'Leads', 
          value: total.toString(), 
          subtitle: `Active: ${active}`,
          change: this.calculateChange(total, prevTotal, 'number'),
          changeType: this.getChangeType(total, prevTotal, true)
        },
        { 
          id: 2, 
          title: 'Conversion Rate', 
          value: `${conversionRate.toFixed(2)}%`, 
          subtitle: 'Cracked / Total',
          change: this.calculateChange(conversionRate, prevConversionRate, 'percentage'),
          changeType: this.getChangeType(conversionRate, prevConversionRate, true)
        },
        { 
          id: 3, 
          title: 'Revenue / Commission', 
          value: `$${this.fmt(Number(revenue._sum.amount || 0))} / $${this.fmt(Number(commission?.commissionAmount || 0))}`, 
          subtitle: 'Total / Your share',
          change: this.calculateChange(Number(revenue._sum.amount || 0), Number(prevRevenue._sum.amount || 0), 'currency'),
          changeType: this.getChangeType(Number(revenue._sum.amount || 0), Number(prevRevenue._sum.amount || 0), true)
        },
        { 
          id: 4, 
          title: 'Won Deals', 
          value: cracked.toString(), 
          subtitle: 'Cracked leads',
          change: this.calculateChange(cracked, prevCracked, 'number'),
          changeType: this.getChangeType(cracked, prevCracked, true)
        }
      ]
    };
  }

  // HR
  private async getHrCards(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateRanges = this.getDateRanges();

    const assignedPending = await this.prisma.hrRequest.count({ where: { assignedTo: user.id, status: 'Pending' } });
    const allPending = await this.prisma.hrRequest.count({ where: { status: 'Pending' } });
    const pending = assignedPending > 0 ? assignedPending : allPending;

    const [employees, attendance, onLeave, prevEmployees, prevAttendance, prevPending, prevOnLeave] = await Promise.all([
      this.prisma.employee.count({ where: { status: 'active' } }),
      this.getAttendanceRate(),
      this.prisma.leaveLog.count({ where: { status: 'Approved', startDate: { lte: today }, endDate: { gte: today } } }),
      // Previous month data
      this.prisma.employee.count({ where: { status: 'active', startDate: { lt: dateRanges.currentMonthStart } } }),
      this.getAttendanceRate(dateRanges.prevMonthStart, dateRanges.currentMonthStart),
      this.prisma.hrRequest.count({ where: { status: 'Pending', requestedOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.leaveLog.count({ where: { status: 'Approved', startDate: { lte: yesterday }, endDate: { gte: yesterday } } })
    ]);

    return {
      department: 'HR',
      role: user.role.name,
      cards: [
        { 
          id: 1, 
          title: 'Employees', 
          value: employees.toString(), 
          subtitle: 'Active employees',
          change: this.calculateChange(employees, prevEmployees, 'number'),
          changeType: this.getChangeType(employees, prevEmployees, true)
        },
        { 
          id: 2, 
          title: 'Attendance Rate', 
          value: `${attendance}%`, 
          subtitle: 'This month',
          change: this.calculateChange(attendance, prevAttendance, 'percentage'),
          changeType: this.getChangeType(attendance, prevAttendance, true)
        },
        { 
          id: 3, 
          title: 'Request Pending', 
          value: pending.toString(), 
          subtitle: assignedPending > 0 ? 'Assigned to you' : 'All pending',
          change: this.calculateChange(pending, prevPending, 'number'),
          changeType: this.getChangeType(pending, prevPending, false) // More pending is negative
        },
        { 
          id: 4, 
          title: 'On Leave Today', 
          value: onLeave.toString(), 
          subtitle: 'Currently on leave',
          change: this.calculateChange(onLeave, prevOnLeave, 'number'),
          changeType: this.getChangeType(onLeave, prevOnLeave, false) // More on leave is negative
        }
      ]
    };
  }

  // PRODUCTION
  private async getProductionCards(user: any, role: string) {
    let where: any = {};
    if (role === 'unit_head') where = { unitHeadId: user.id };
    else if (role === 'team_lead') where = { teamId: user.teamsAsLead[0]?.id || -1 };
    else if (role !== 'dep_manager') where = { projectLogs: { some: { developerId: user.id } } };
    else where = { team: { productionUnitId: { not: null } } };

    const dateRanges = this.getDateRanges();
    const prevWhere = { ...where, createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } };

    const [totalProjects, prevTotalProjects, card2, card3, card4] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.count({ where: prevWhere }),
      this.getProductionCard2(user, role),
      this.getProductionCard3(user, role, where),
      this.getProductionCard4(user, role, where)
    ]);

    return {
      department: 'Production',
      role,
      cards: [
        { 
          id: 1, 
          title: 'Total Projects', 
          value: totalProjects.toString(), 
          subtitle: this.getSubtitle(role),
          change: this.calculateChange(totalProjects, prevTotalProjects, 'number'),
          changeType: this.getChangeType(totalProjects, prevTotalProjects, true)
        },
        card2,
        card3,
        card4
      ]
    };
  }

  private async getProductionCard2(user: any, role: string) {
    const dateRanges = this.getDateRanges();
    
    if (role === 'dep_manager') {
      const [count, prevCount] = await Promise.all([
        this.prisma.productionUnit.count(),
        this.prisma.productionUnit.count({
          where: {
            createdAt: { lt: dateRanges.currentMonthStart }
          }
        })
      ]);
      return { 
        id: 2, 
        title: 'Production Units', 
        value: count.toString(), 
        subtitle: 'Total units',
        change: this.calculateChange(count, prevCount, 'number'),
        changeType: this.getChangeType(count, prevCount, true)
      };
    }
    if (role === 'unit_head') {
      const unit = await this.prisma.productionUnit.findFirst({ where: { headId: user.id } });
      const [count, prevCount] = await Promise.all([
        this.prisma.team.count({ where: { productionUnitId: unit?.id } }),
        this.prisma.team.count({ 
          where: { 
            productionUnitId: unit?.id,
            createdAt: { lt: dateRanges.currentMonthStart }
          } 
        })
      ]);
      return { 
        id: 2, 
        title: 'Teams', 
        value: count.toString(), 
        subtitle: 'In your unit',
        change: this.calculateChange(count, prevCount, 'number'),
        changeType: this.getChangeType(count, prevCount, true)
      };
    }
    if (role === 'team_lead') {
      const team = await this.prisma.team.findFirst({ where: { teamLeadId: user.id } });
      if (!team?.teamLeadId) {
        return { 
          id: 2, 
          title: 'Team Members', 
          value: '0', 
          subtitle: 'In your team',
          change: 'No Team',
          changeType: 'neutral' as const
        };
      }
      const dateRangesForTeam = this.getDateRanges();
      const [count, prevCount] = await Promise.all([
        this.prisma.employee.count({ where: { OR: [{ id: team.teamLeadId }, { teamLeadId: team.teamLeadId }] } }),
        this.prisma.employee.count({ 
          where: { 
            OR: [{ id: team.teamLeadId }, { teamLeadId: team.teamLeadId }],
            createdAt: { lt: dateRangesForTeam.currentMonthStart }
          } 
        })
      ]);
      return { 
        id: 2, 
        title: 'Team Members', 
        value: count.toString(), 
        subtitle: 'In your team',
        change: this.calculateChange(count, prevCount, 'number'),
        changeType: this.getChangeType(count, prevCount, true)
      };
    }
    const emp = await this.prisma.employee.findUnique({ 
      where: { id: user.id }, 
      include: { 
        teamLead: { 
          include: { 
            teamsAsLead: { 
              select: { name: true } 
            } 
          } 
        } 
      } 
    });
    const teamName = emp?.teamLead?.teamsAsLead[0]?.name || 'No Team';
    return { 
      id: 2, 
      title: 'Team', 
      value: teamName, 
      subtitle: 'Your team',
      change: teamName !== 'No Team' ? 'Team assigned' : 'No Team',
      changeType: 'neutral' as const
    };
  }

  private async getProductionCard3(user: any, role: string, where: any) {
    const activeWhere = { ...where, status: 'in_progress' };
    const dateRanges = this.getDateRanges();
    const prevActiveWhere = { ...activeWhere, createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } };

    if (role === 'dep_manager' || role === 'unit_head') {
      const [count, prevCount] = await Promise.all([
        this.prisma.project.count({ where: activeWhere }),
        this.prisma.project.count({ where: prevActiveWhere })
      ]);
      return { 
        id: 3, 
        title: 'Active Projects', 
        value: count.toString(), 
        subtitle: 'In progress',
        change: this.calculateChange(count, prevCount, 'number'),
        changeType: this.getChangeType(count, prevCount, true)
      };
    }
    const project = await this.prisma.project.findFirst({ 
      where: activeWhere, 
      select: { deadline: true }, 
      orderBy: { deadline: 'asc' } 
    });
    return { 
      id: 3, 
      title: 'Next Deadline', 
      value: project?.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'None', 
      subtitle: 'Active project',
      change: project?.deadline ? 'Upcoming' : 'No deadline',
      changeType: 'neutral' as const
    };
  }

  private async getProductionCard4(user: any, role: string, where: any) {
    const activeWhere = { ...where, status: 'in_progress' };
    if (role === 'dep_manager' || role === 'unit_head') {
      const prod = await this.prisma.production.findFirst({
        where: role === 'unit_head' ? { productionUnit: { headId: user.id } } : {},
        orderBy: { projectsCompleted: 'desc' },
        select: { projectsCompleted: true, employee: { select: { firstName: true, lastName: true } } }
      });
      // For most completed, we can't easily compare, so show neutral
      return { 
        id: 4, 
        title: 'Most Completed', 
        value: (prod?.projectsCompleted || 0).toString(), 
        subtitle: prod ? `${prod.employee.firstName} ${prod.employee.lastName}` : 'No data',
        change: prod ? 'Top performer' : 'No Performer',
        changeType: 'neutral' as const
      };
    }
    const dateRangesForProgress = this.getDateRanges();
    const [project, prevProject] = await Promise.all([
      this.prisma.project.findFirst({ 
        where: activeWhere, 
        select: { liveProgress: true, updatedAt: true }, 
        orderBy: { updatedAt: 'desc' } 
      }),
      this.prisma.project.findFirst({ 
        where: { ...activeWhere, updatedAt: { gte: dateRangesForProgress.prevMonthStart, lt: dateRangesForProgress.currentMonthStart } }, 
        select: { liveProgress: true }, 
        orderBy: { updatedAt: 'desc' } 
      })
    ]);
    const currentProgress = project?.liveProgress ? Number(project.liveProgress) : 0;
    const prevProgress = prevProject?.liveProgress ? Number(prevProject.liveProgress) : 0;
    return { 
      id: 4, 
      title: 'Progress', 
      value: `${currentProgress}%`, 
      subtitle: 'Current project',
      change: this.calculateChange(currentProgress, prevProgress, 'percentage'),
      changeType: this.getChangeType(currentProgress, prevProgress, true)
    };
  }

  // ACCOUNTANT
  private async getAccountantCards() {
    const dateRanges = this.getDateRanges();

    const [revenue, expenses, allRevenue, allExpenses, prevRevenue, prevExpenses] = await Promise.all([
      this.prisma.revenue.aggregate({ where: { receivedOn: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { paidOn: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd } }, _sum: { amount: true } }),
      this.prisma.revenue.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      // Previous month data
      this.prisma.revenue.aggregate({ where: { receivedOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { paidOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } })
    ]);

    const rev = Number(revenue._sum.amount || 0);
    const exp = Number(expenses._sum.amount || 0);
    const profit = Number(allRevenue._sum.amount || 0) - Number(allExpenses._sum.amount || 0);
    const prevRev = Number(prevRevenue._sum.amount || 0);
    const prevExp = Number(prevExpenses._sum.amount || 0);
    // Calculate previous month profit (all time profit minus current month profit)
    const currentMonthProfit = rev - exp;
    const prevMonthProfit = prevRev - prevExp;

    return {
      department: 'Accounts',
      role: 'accountant',
      cards: [
        { 
          id: 1, 
          title: 'Profit', 
          value: this.fmtCurrency(profit), 
          subtitle: 'All time',
          change: this.calculateChange(currentMonthProfit, prevMonthProfit, 'currency'),
          changeType: this.getChangeType(currentMonthProfit, prevMonthProfit, true)
        },
        { 
          id: 2, 
          title: 'Expense', 
          value: this.fmtCurrency(exp), 
          subtitle: 'This month',
          change: this.calculateChange(exp, prevExp, 'currency'),
          changeType: this.getChangeType(exp, prevExp, false) // More expense is negative
        },
        { 
          id: 3, 
          title: 'Cash Flow', 
          value: this.fmtCurrency(rev - exp), 
          subtitle: 'This month',
          change: this.calculateChange(rev - exp, prevRev - prevExp, 'currency'),
          changeType: this.getChangeType(rev - exp, prevRev - prevExp, true)
        },
        { 
          id: 4, 
          title: 'Revenue', 
          value: this.fmtCurrency(rev), 
          subtitle: 'This month',
          change: this.calculateChange(rev, prevRev, 'currency'),
          changeType: this.getChangeType(rev, prevRev, true)
        }
      ]
    };
  }

  // HELPERS
  private getDateRanges() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    return {
      currentMonthStart,
      currentMonthEnd,
      prevMonthStart,
      prevMonthEnd
    };
  }

  private calculateChange(current: number, previous: number, type: 'number' | 'percentage' | 'currency'): string {
    if (previous === 0) {
      if (current === 0) return 'Same as last month';
      return type === 'currency' ? `+$${this.fmt(current)} this month` : `+${current} this month`;
    }

    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);

    if (diff === 0) return 'Same as last month';

    if (type === 'percentage') {
      return `${diff > 0 ? '+' : ''}${percentChange}% from last month`;
    }

    if (type === 'currency') {
      const absDiff = Math.abs(diff);
      return `${diff > 0 ? '+' : '-'}$${this.fmt(absDiff)} from last month`;
    }

    // number type
    return `${diff > 0 ? '+' : ''}${diff} from last month`;
  }

  private getChangeType(current: number, previous: number, higherIsBetter: boolean): 'positive' | 'negative' | 'neutral' {
    if (previous === 0 || current === previous) return 'neutral';
    
    const isIncrease = current > previous;
    
    if (higherIsBetter) {
      return isIncrease ? 'positive' : 'negative';
    }
    
    // higherIsBetter is false (e.g., expenses, pending requests)
    return isIncrease ? 'negative' : 'positive';
  }

  private async getAttendanceRate(startDate?: Date, endDate?: Date) {
    let month: string;
    if (startDate && endDate) {
      // Previous month
      month = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Current month
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const summary = await this.prisma.monthlyAttendanceSummary.findMany({ where: { month } });
    if (summary.length === 0) return 0;
    const present = summary.reduce((s, x) => s + x.totalPresent, 0);
    const absent = summary.reduce((s, x) => s + x.totalAbsent, 0);
    return present + absent > 0 ? Math.round((present / (present + absent)) * 10000) / 100 : 0;
  }

  private getSubtitle(role: string) {
    if (role === 'unit_head') return 'In your unit';
    if (role === 'team_lead') return 'Team projects';
    if (role === 'senior' || role === 'junior') return 'Assigned to you';
    return 'All projects';
  }

  private fmt(n: number) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toFixed(0);
  }

  private fmtCurrency(n: number) {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  }

  private formatActionType(actionType: string | null): string {
    if (!actionType) return '';
    // Convert underscore to space and capitalize each word
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractBulkMarkPresentReason(description: string | null): string {
    if (!description) return '';
    
    // New format: "{count} employees - {reason}" or "{count} employees"
    const newFormatMatch = description.match(/^(\d+)\s+employees(?:\s+-\s+(.+))?$/);
    if (newFormatMatch) {
      const count = newFormatMatch[1];
      const reason = newFormatMatch[2]?.trim() || '';
      return reason ? `${count} employees - ${reason}` : `${count} employees`;
    }
    
    // Old format: Extract count and reason from old descriptions
    // Pattern 1: "Bulk checkin: {count} employee(s) ... - Reason: {reason}"
    const oldFormatMatch1 = description.match(/Bulk checkin:\s*(\d+)\s+employee\(s\).*?-\s+Reason:\s*(.+)$/);
    if (oldFormatMatch1) {
      const count = oldFormatMatch1[1];
      const reason = oldFormatMatch1[2].trim();
      return `${count} employees - ${reason}`;
    }
    
    // Pattern 2: "Bulk marked {count} employee(s) ... - Reason: {reason}"
    const oldFormatMatch2 = description.match(/Bulk marked\s+(\d+)\s+employee\(s\).*?-\s+Reason:\s*(.+)$/);
    if (oldFormatMatch2) {
      const count = oldFormatMatch2[1];
      const reason = oldFormatMatch2[2].trim();
      return `${count} employees - ${reason}`;
    }
    
    // Pattern 3: Just extract reason if count pattern not found
    const reasonMatch = description.match(/- Reason:\s*(.+)$/);
    if (reasonMatch && reasonMatch[1]) {
      return reasonMatch[1].trim();
    }
    
    // If no pattern matches, return as-is
    return description;
  }

  // ACTIVITY FEED
  async getActivityFeed(userId: number, department: string, role: string, limit: number = 20) {
    // Get activities based on department - using JWT token data directly
    let activities: any[] = [];
    
    if (department === 'HR') activities = await this.getHrActivitiesOptimized(userId, role, limit);
    else if (department === 'Sales') activities = await this.getSalesActivitiesOptimized(userId, role, limit);
    else if (department === 'Production') activities = await this.getProductionActivitiesOptimized(userId, role, limit);
    else if (department === 'Marketing') activities = await this.getMarketingActivitiesOptimized(userId, role, limit);
    else if (department === 'Accounts') activities = await this.getAccountantActivitiesOptimized(userId, role, limit);

    return {
      department,
      role,
      activities: activities.slice(0, limit),
      total: activities.length
    };
  }

  // OPTIMIZED HR Activities - Direct department filtering, no user lookup
  // Only includes activities PERFORMED BY HR employees (HR Logs), not HR Requests
  private async getHrActivitiesOptimized(userId: number, role: string, limit: number) {
    // Only fetch HR Logs - activities performed by HR employees
    const hrLogs = await this.prisma.hRLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: {
        hr: {
          employee: {
            department: { name: 'HR' }
          }
        }
      },
      select: {
        id: true,
        actionType: true,
        description: true,
        createdAt: true,
        hr: {
          select: {
            employee: {
              select: { firstName: true, lastName: true, id: true }
            }
          }
        },
        affectedEmployee: {
          select: { firstName: true, lastName: true, id: true }
        }
      }
    });

    const activities: any[] = [];

    // Process HR Logs - only activities performed by HR employees
    hrLogs.forEach(log => {
      // For bulk_mark_present, extract only the reason from description
      const isBulkMarkPresent = log.actionType === 'bulk_mark_present';
      const description = isBulkMarkPresent 
        ? this.extractBulkMarkPresentReason(log.description)
        : (log.description || `${log.hr.employee.firstName} ${log.hr.employee.lastName} performed ${this.formatActionType(log.actionType)}`);
      
      activities.push({
        id: `hr_log_${log.id}`,
        type: 'HR Activity',
        title: this.formatActionType(log.actionType) || 'HR Action',
        description,
        createdAt: log.createdAt,
        actor: `${log.hr.employee.firstName} ${log.hr.employee.lastName}`,
        relatedEntity: log.affectedEmployee ? {
          type: 'employee',
          id: log.affectedEmployee.id,
          name: `${log.affectedEmployee.firstName} ${log.affectedEmployee.lastName}`
        } : null
      });
    });

    // Sort and limit
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // OPTIMIZED Sales Activities - Direct department filtering
  private async getSalesActivitiesOptimized(userId: number, role: string, limit: number) {
    // Build where clause based on role
    let leadWhere: any = {
      OR: [
        { assignedTo: { department: { name: 'Sales' } } },
        { crackedBy: { department: { name: 'Sales' } } },
        { startedBy: { department: { name: 'Sales' } } },
        { closedBy: { department: { name: 'Sales' } } }
      ]
    };

    if (role === 'unit_head') {
      leadWhere = { ...leadWhere, salesUnit: { headId: userId } };
    } else if (role === 'team_lead') {
      leadWhere = { ...leadWhere, assignedTo: { teamLeadId: userId } };
    } else if (role !== 'dep_manager') {
      leadWhere = { ...leadWhere, assignedToId: userId };
    }

    // Single parallel query for leads and cracked leads
    const [leads, crackedLeads] = await Promise.all([
      // Leads - Direct department filter
      this.prisma.lead.findMany({
        where: leadWhere,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          updatedAt: true,
          assignedTo: {
            select: { firstName: true, lastName: true, id: true }
          },
          crackedBy: {
            select: { firstName: true, lastName: true, id: true }
          },
          startedBy: {
            select: { firstName: true, lastName: true, id: true }
          },
          closedBy: {
            select: { firstName: true, lastName: true, id: true }
          }
        }
      }),

      // Cracked Leads - Direct department filter
      this.prisma.crackedLead.findMany({
        where: {
          employee: { department: { name: 'Sales' } },
          lead: role === 'unit_head' ? { salesUnit: { headId: userId } } :
                role === 'team_lead' ? { assignedTo: { teamLeadId: userId } } :
                role !== 'dep_manager' ? { assignedToId: userId } : {}
        },
        take: limit,
        orderBy: { crackedAt: 'desc' },
        select: {
          id: true,
          amount: true,
          crackedAt: true,
          employee: {
            select: { firstName: true, lastName: true, id: true }
          },
          lead: {
            select: { name: true, email: true }
          }
        }
      })
    ]);

    const activities: any[] = [];

    // Process Leads
    leads.forEach(lead => {
      const actor = lead.crackedBy || lead.assignedTo || lead.startedBy || lead.closedBy;
      if (actor) {
        activities.push({
          id: `lead_${lead.id}`,
          type: 'Lead Activity',
          title: lead.status === 'cracked' ? 'Lead Converted' : `Lead ${lead.status}`,
          description: `Lead "${lead.name || lead.email}" was ${lead.status === 'cracked' ? 'converted' : lead.status} by ${actor.firstName} ${actor.lastName}`,
          createdAt: lead.updatedAt,
          actor: `${actor.firstName} ${actor.lastName}`,
          relatedEntity: { type: 'lead', id: lead.id, name: lead.name || lead.email }
        });
      }
    });

    // Process Cracked Leads
    crackedLeads.forEach(cracked => {
      activities.push({
        id: `cracked_lead_${cracked.id}`,
        type: 'Deal Closed',
        title: 'Deal Closed',
        description: `Deal closed for $${cracked.amount} by ${cracked.employee.firstName} ${cracked.employee.lastName}`,
        createdAt: cracked.crackedAt,
        actor: `${cracked.employee.firstName} ${cracked.employee.lastName}`,
        relatedEntity: { type: 'cracked_lead', id: cracked.id }
      });
    });

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // OPTIMIZED Production Activities
  private async getProductionActivitiesOptimized(userId: number, role: string, limit: number) {
    // Get team IDs if needed (only for team_lead role)
    let teamIds: number[] = [];
    if (role === 'team_lead') {
      const teams = await this.prisma.team.findMany({
        where: { teamLeadId: userId },
        select: { id: true }
      });
      teamIds = teams.map(t => t.id);
    }

    // Build project where clause
    let projectWhere: any = {
      projectLogs: {
        some: {
          developer: { department: { name: 'Production' } }
        }
      }
    };

    if (role === 'unit_head') {
      projectWhere = { ...projectWhere, unitHeadId: userId };
    } else if (role === 'team_lead' && teamIds.length > 0) {
      projectWhere = { ...projectWhere, teamId: { in: teamIds } };
    } else if (role !== 'dep_manager') {
      projectWhere = { ...projectWhere, projectLogs: { some: { developerId: userId } } };
    }

    // Single query for projects only (no tasks)
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        projectLogs: {
          where: {
            developer: { department: { name: 'Production' } }
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            developer: {
              select: { firstName: true, lastName: true, id: true }
            }
          }
        }
      }
    });

    const activities: any[] = [];

    // Process Projects
    projects.forEach(project => {
      const latestLog = project.projectLogs[0];
      if (latestLog) {
        activities.push({
          id: `project_${project.id}`,
          type: 'Project Activity',
          title: `Project ${project.status}`,
          description: `Project status changed to ${project.status} by ${latestLog.developer.firstName} ${latestLog.developer.lastName}`,
          createdAt: project.updatedAt,
          actor: `${latestLog.developer.firstName} ${latestLog.developer.lastName}`,
          relatedEntity: { type: 'project', id: project.id }
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // OPTIMIZED Marketing Activities
  private async getMarketingActivitiesOptimized(userId: number, role: string, limit: number) {
    // Build campaign where clause
    let campaignWhere: any = {
      marketingUnit: {
        marketingEmployees: {
          some: {
            employee: { department: { name: 'Marketing' } }
          }
        }
      }
    };

    if (role === 'unit_head') {
      campaignWhere = {
        ...campaignWhere,
        marketingUnit: {
          ...campaignWhere.marketingUnit,
          headId: userId
        }
      };
    }

    // Single query for campaigns
    const campaigns = await this.prisma.campaignLog.findMany({
      where: campaignWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        campaignName: true,
        status: true,
        createdAt: true,
        marketingUnit: {
          select: {
            marketingEmployees: {
              where: {
                employee: { department: { name: 'Marketing' } }
              },
              take: 1,
              select: {
                employee: {
                  select: { firstName: true, lastName: true, id: true }
                }
              }
            }
          }
        }
      }
    });

    const activities: any[] = [];

    campaigns.forEach(campaign => {
      const employee = campaign.marketingUnit.marketingEmployees[0]?.employee;
      if (employee) {
        activities.push({
          id: `campaign_${campaign.id}`,
          type: 'Campaign Activity',
          title: `Campaign ${campaign.status}`,
          description: `Campaign "${campaign.campaignName}" ${campaign.status === 'Running' ? 'launched' : campaign.status.toLowerCase()} by ${employee.firstName} ${employee.lastName}`,
          createdAt: campaign.createdAt,
          actor: `${employee.firstName} ${employee.lastName}`,
          relatedEntity: { type: 'campaign', id: campaign.id, name: campaign.campaignName }
        });
      }
    });

    return activities;
  }

  // OPTIMIZED Accountant Activities - Single parallel query
  private async getAccountantActivitiesOptimized(userId: number, role: string, limit: number) {
    // Single parallel query for all financial activities
    const [transactions, revenues, expenses] = await Promise.all([
      // Transactions
      this.prisma.transaction.findMany({
        where: {
          employee: { department: { name: 'Accounts' } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionType: true,
          amount: true,
          createdAt: true,
          employee: {
            select: { firstName: true, lastName: true, id: true }
          }
        }
      }),

      // Revenues
      this.prisma.revenue.findMany({
        where: {
          employee: { department: { name: 'Accounts' } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          employee: {
            select: { firstName: true, lastName: true, id: true }
          }
        }
      }),

      // Expenses
      this.prisma.expense.findMany({
        where: {
          employee: { department: { name: 'Accounts' } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          employee: {
            select: { firstName: true, lastName: true, id: true }
          }
        }
      })
    ]);

    const activities: any[] = [];

    // Process Transactions
    transactions.forEach(transaction => {
      if (transaction.employee) {
        activities.push({
          id: `transaction_${transaction.id}`,
          type: 'Transaction',
          title: `${transaction.transactionType} Transaction`,
          description: `${transaction.transactionType} transaction of $${transaction.amount} processed by ${transaction.employee.firstName} ${transaction.employee.lastName}`,
          createdAt: transaction.createdAt,
          actor: `${transaction.employee.firstName} ${transaction.employee.lastName}`,
          relatedEntity: { type: 'transaction', id: transaction.id }
        });
      }
    });

    // Process Revenues
    revenues.forEach(revenue => {
      if (revenue.employee) {
        activities.push({
          id: `revenue_${revenue.id}`,
          type: 'Revenue',
          title: 'Revenue Recorded',
          description: `Revenue of $${revenue.amount} recorded by ${revenue.employee.firstName} ${revenue.employee.lastName}`,
          createdAt: revenue.createdAt,
          actor: `${revenue.employee.firstName} ${revenue.employee.lastName}`,
          relatedEntity: { type: 'revenue', id: revenue.id }
        });
      }
    });

    // Process Expenses
    expenses.forEach(expense => {
      if (expense.employee) {
        activities.push({
          id: `expense_${expense.id}`,
          type: 'Expense',
          title: 'Expense Recorded',
          description: `Expense of $${expense.amount} recorded by ${expense.employee.firstName} ${expense.employee.lastName}`,
          createdAt: expense.createdAt,
          actor: `${expense.employee.firstName} ${expense.employee.lastName}`,
          relatedEntity: { type: 'expense', id: expense.id }
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // HR REQUESTS - Optimized with single query and direct Prisma relations
  async getHrRequests(userId: number, department: string, role: string, limit: number = 10) {
    // Only for HR department
    if (department !== 'HR') {
      return {
        department,
        role,
        requests: [],
        total: 0
      };
    }

    // Build where clause based on role - using direct Prisma relations (NO extra queries!)
    let where: any = {};

    if (role === 'unit_head') {
      // Unit head: See requests from employees in their unit
      // Handle both Sales and Production units - using direct Prisma relations
      where = {
        OR: [
          // Sales unit employees (through salesDepartment)
          { 
            employee: { 
              salesDepartment: { 
                salesUnit: { headId: userId } 
              } 
            } 
          },
          // Production unit employees (through production)
          { 
            employee: { 
              production: { 
                productionUnit: { headId: userId } 
              } 
            } 
          }
        ]
      };
    } else if (role === 'team_lead') {
      // Team lead: See requests from their team members (direct relation - NO query needed!)
      where = {
        employee: { teamLeadId: userId }
      };
    }
    // For dep_manager, where remains empty (all requests)

    // Single optimized query - fetches everything in one go
    const hrRequests = await this.prisma.hrRequest.findMany({
      where,
      take: limit,
      orderBy: { requestedOn: 'desc' },
      select: {
        id: true,
        requestType: true,
        subject: true,
        description: true,
        priority: true,
        status: true,
        requestedOn: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Transform to frontend format
    const requests = hrRequests.map(request => ({
      id: request.id.toString(),
      title: request.subject || request.requestType || 'HR Request',
      employee: `${request.employee.firstName} ${request.employee.lastName}`,
      department: request.employee.department?.name || 'Unknown',
      type: this.mapRequestType(request.requestType),
      status: this.mapRequestStatus(request.status),
      priority: this.mapRequestPriority(request.priority),
      submittedDate: this.getRelativeTime(request.requestedOn),
      description: request.description || ''
    }));

    return {
      department,
      role,
      requests,
      total: requests.length
    };
  }

  // Helper methods for HR Requests
  private mapRequestType(requestType: string | null): 'Leave' | 'Salary' | 'Training' | 'Complaint' | 'Other' {
    if (!requestType) return 'Other';
    
    const type = requestType.toLowerCase();
    if (type.includes('leave')) return 'Leave';
    if (type.includes('salary') || type.includes('payroll') || type.includes('pay')) return 'Salary';
    if (type.includes('training')) return 'Training';
    if (type.includes('complaint')) return 'Complaint';
    return 'Other';
  }

  private mapRequestStatus(status: any): 'Pending' | 'Approved' | 'Rejected' | 'Under Review' {
    if (!status) return 'Pending';
    
    const statusStr = status.toString();
    if (statusStr === 'Pending') return 'Pending';
    if (statusStr === 'Resolved') return 'Approved';
    if (statusStr === 'Rejected') return 'Rejected';
    if (statusStr === 'In_Progress' || statusStr === 'In Progress') return 'Under Review';
    return 'Pending';
  }

  private mapRequestPriority(priority: any): 'Low' | 'Medium' | 'High' | 'Urgent' {
    if (!priority) return 'Low';
    
    const priorityStr = priority.toString();
    if (priorityStr === 'Urgent') return 'Urgent';
    if (priorityStr === 'High') return 'High';
    if (priorityStr === 'Medium') return 'Medium';
    return 'Low';
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }
}

