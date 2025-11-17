import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetricGrid(userId: number, userType?: string) {
    // Check if user is Admin
    if (userType === 'admin') {
      return await this.getAdminCards();
    }

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
  async getActivityFeed(userId: number, department: string, role: string, userType?: string, limit: number = 20) {
    // Check if user is Admin
    if (userType === 'admin' || !department || department === 'Admin' || role === 'admin') {
      return await this.getAdminActivities(limit);
    }

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

  // ADMIN ACTIVITIES - Combined activities from all departments, prioritized
  private async getAdminActivities(limit: number = 20) {
    // Get activities from all departments in parallel
    const [
      salesActivities,
      accountsActivities,
      productionActivities,
      hrActivities,
      marketingActivities
    ] = await Promise.all([
      // Sales - Focus on deals closed and lead conversions (most important)
      this.getSalesActivitiesForAdmin(limit * 2), // Get more to prioritize
      // Accounts - All financial activities (revenue, expenses, transactions)
      this.getAccountantActivitiesForAdmin(limit * 2),
      // Production - Project completions and major status changes
      this.getProductionActivitiesForAdmin(limit),
      // HR - Employee management actions
      this.getHrActivitiesForAdmin(limit),
      // Marketing - Campaign launches
      this.getMarketingActivitiesForAdmin(limit)
    ]);

    // Combine and prioritize activities
    const allActivities = [
      // Priority 1: Deals Closed (highest priority - revenue events)
      ...salesActivities.filter(a => a.type === 'Deal Closed'),
      // Priority 2: Revenue Recorded
      ...accountsActivities.filter(a => a.type === 'Revenue'),
      // Priority 3: Large Expenses (filter by amount threshold)
      ...accountsActivities.filter(a => a.type === 'Expense' && this.isLargeAmount(a.description)),
      // Priority 4: Lead Converted
      ...salesActivities.filter(a => a.title === 'Lead Converted'),
      // Priority 5: Project Completed
      ...productionActivities.filter(a => a.title?.toLowerCase().includes('completed')),
      // Priority 6: Large Transactions
      ...accountsActivities.filter(a => a.type === 'Transaction' && this.isLargeAmount(a.description)),
      // Priority 7: Other Revenue/Expense activities
      ...accountsActivities.filter(a => a.type === 'Revenue' || (a.type === 'Expense' && !this.isLargeAmount(a.description))),
      // Priority 8: Project status changes
      ...productionActivities.filter(a => !a.title?.toLowerCase().includes('completed')),
      // Priority 9: HR important actions (employee added, terminated, etc.)
      ...hrActivities.filter(a => this.isImportantHrAction(a.title)),
      // Priority 10: Campaign activities
      ...marketingActivities,
      // Priority 11: Other sales activities
      ...salesActivities.filter(a => a.type !== 'Deal Closed' && a.title !== 'Lead Converted'),
      // Priority 12: Other HR activities
      ...hrActivities.filter(a => !this.isImportantHrAction(a.title)),
      // Priority 13: Other transactions
      ...accountsActivities.filter(a => a.type === 'Transaction' && !this.isLargeAmount(a.description))
    ];

    // Sort by creation date (most recent first) and limit
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return {
      department: 'Admin',
      role: 'admin',
      activities: sortedActivities,
      total: sortedActivities.length
    };
  }

  // Helper methods for Admin activities
  private async getSalesActivitiesForAdmin(limit: number) {
    const [leads, crackedLeads] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          OR: [
            { status: 'cracked' },
            { status: 'in_progress' }
          ]
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          updatedAt: true,
          crackedBy: {
            select: { firstName: true, lastName: true, id: true }
          },
          assignedTo: {
            select: { firstName: true, lastName: true, id: true }
          }
        }
      }),
      this.prisma.crackedLead.findMany({
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

    // Process Cracked Leads (Deals Closed) - Highest priority
    crackedLeads.forEach(cracked => {
      activities.push({
        id: `cracked_lead_${cracked.id}`,
        type: 'Deal Closed',
        title: 'Deal Closed',
        description: `Deal closed for $${this.fmt(Number(cracked.amount))} by ${cracked.employee.firstName} ${cracked.employee.lastName}`,
        createdAt: cracked.crackedAt,
        actor: `${cracked.employee.firstName} ${cracked.employee.lastName}`,
        department: 'Sales',
        relatedEntity: { type: 'cracked_lead', id: cracked.id }
      });
    });

    // Process Lead Conversions
    leads.filter(l => l.status === 'cracked' && l.crackedBy).forEach(lead => {
      if (lead.crackedBy) {
        activities.push({
          id: `lead_${lead.id}`,
          type: 'Lead Activity',
          title: 'Lead Converted',
          description: `Lead "${lead.name || lead.email}" was converted by ${lead.crackedBy.firstName} ${lead.crackedBy.lastName}`,
          createdAt: lead.updatedAt,
          actor: `${lead.crackedBy.firstName} ${lead.crackedBy.lastName}`,
          department: 'Sales',
          relatedEntity: { type: 'lead', id: lead.id, name: lead.name || lead.email }
        });
      }
    });

    return activities;
  }

  private async getAccountantActivitiesForAdmin(limit: number) {
    const [revenues, expenses, transactions] = await Promise.all([
      this.prisma.revenue.findMany({
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
      this.prisma.expense.findMany({
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
      this.prisma.transaction.findMany({
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
      })
    ]);

    const activities: any[] = [];

    revenues.forEach(revenue => {
      if (revenue.employee) {
        activities.push({
          id: `revenue_${revenue.id}`,
          type: 'Revenue',
          title: 'Revenue Recorded',
          description: `Revenue of $${this.fmt(Number(revenue.amount))} recorded by ${revenue.employee.firstName} ${revenue.employee.lastName}`,
          createdAt: revenue.createdAt,
          actor: `${revenue.employee.firstName} ${revenue.employee.lastName}`,
          department: 'Accounts',
          relatedEntity: { type: 'revenue', id: revenue.id }
        });
      }
    });

    expenses.forEach(expense => {
      if (expense.employee) {
        activities.push({
          id: `expense_${expense.id}`,
          type: 'Expense',
          title: 'Expense Recorded',
          description: `Expense of $${this.fmt(Number(expense.amount))} recorded by ${expense.employee.firstName} ${expense.employee.lastName}`,
          createdAt: expense.createdAt,
          actor: `${expense.employee.firstName} ${expense.employee.lastName}`,
          department: 'Accounts',
          relatedEntity: { type: 'expense', id: expense.id }
        });
      }
    });

    transactions.forEach(transaction => {
      if (transaction.employee) {
        activities.push({
          id: `transaction_${transaction.id}`,
          type: 'Transaction',
          title: `${transaction.transactionType} Transaction`,
          description: `${transaction.transactionType} transaction of $${this.fmt(Number(transaction.amount))} processed by ${transaction.employee.firstName} ${transaction.employee.lastName}`,
          createdAt: transaction.createdAt,
          actor: `${transaction.employee.firstName} ${transaction.employee.lastName}`,
          department: 'Accounts',
          relatedEntity: { type: 'transaction', id: transaction.id }
        });
      }
    });

    return activities;
  }

  private async getProductionActivitiesForAdmin(limit: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        team: { productionUnitId: { not: null } }
      },
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

    projects.forEach(project => {
      const latestLog = project.projectLogs[0];
      if (latestLog) {
        activities.push({
          id: `project_${project.id}`,
          type: 'Project Activity',
          title: project.status === 'completed' ? 'Project Completed' : `Project ${project.status}`,
          description: `Project status changed to ${project.status} by ${latestLog.developer.firstName} ${latestLog.developer.lastName}`,
          createdAt: project.updatedAt,
          actor: `${latestLog.developer.firstName} ${latestLog.developer.lastName}`,
          department: 'Production',
          relatedEntity: { type: 'project', id: project.id }
        });
      }
    });

    return activities;
  }

  private async getHrActivitiesForAdmin(limit: number) {
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

    hrLogs.forEach(log => {
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
        department: 'HR',
        relatedEntity: log.affectedEmployee ? {
          type: 'employee',
          id: log.affectedEmployee.id,
          name: `${log.affectedEmployee.firstName} ${log.affectedEmployee.lastName}`
        } : null
      });
    });

    return activities;
  }

  private async getMarketingActivitiesForAdmin(limit: number) {
    const campaigns = await this.prisma.campaignLog.findMany({
      where: {
        marketingUnit: {
          marketingEmployees: {
            some: {
              employee: { department: { name: 'Marketing' } }
            }
          }
        }
      },
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
          department: 'Marketing',
          relatedEntity: { type: 'campaign', id: campaign.id, name: campaign.campaignName }
        });
      }
    });

    return activities;
  }

  // Helper methods
  private isLargeAmount(description: string): boolean {
    // Extract amount from description and check if > $10,000
    // Pattern: $5.4M, $743.4K, $10000, etc.
    const amountMatch = description.match(/\$([\d,]+(?:\.\d+)?)([KM])?/);
    if (!amountMatch) return false;
    
    let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const suffix = amountMatch[2];
    const multiplier = suffix === 'K' ? 1000 : suffix === 'M' ? 1000000 : 1;
    amount = amount * multiplier;
    
    return amount >= 10000;
  }

  private isImportantHrAction(title: string): boolean {
    const importantActions = ['employee added', 'employee terminated', 'employee updated', 'salary updated'];
    return importantActions.some(action => title.toLowerCase().includes(action));
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

  // ADMIN CARDS - Includes Admin cards + all department manager cards
  private async getAdminCards() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateRanges = this.getDateRanges();

    // Get all metrics in parallel
    const [
      totalUsers,
      activeTodayLogs,
      departments,
      prevTotalUsers,
      prevActiveTodayLogs,
      prevDepartments,
      // Sales dep_manager data
      salesTotal,
      salesActive,
      salesCracked,
      salesRevenue,
      salesPrevTotal,
      salesPrevCracked,
      salesPrevRevenue,
      // HR dep_manager data
      hrEmployees,
      hrAttendance,
      hrOnLeave,
      hrPending,
      hrPrevEmployees,
      hrPrevAttendance,
      hrPrevPending,
      hrPrevOnLeave,
      // Production dep_manager data
      prodTotalProjects,
      prodPrevTotalProjects,
      prodProductionUnits,
      prodPrevProductionUnits,
      prodActiveProjects,
      prodPrevActiveProjects,
      prodMostCompleted,
      // Accounts dep_manager data
      accRevenue,
      accExpenses,
      accAllRevenue,
      accAllExpenses,
      accPrevRevenue,
      accPrevExpenses
    ] = await Promise.all([
      // Admin metrics
      this.prisma.employee.count(),
      this.prisma.attendanceLog.findMany({
        where: {
          date: { gte: today, lt: tomorrow },
          OR: [{ status: 'present' }, { checkin: { not: null } }],
          employee: { status: 'active' }
        },
        select: { employeeId: true },
        distinct: ['employeeId']
      }),
      this.prisma.department.count(),
      this.prisma.employee.count({
        where: { createdAt: { lt: dateRanges.currentMonthStart } }
      }),
      this.prisma.attendanceLog.findMany({
        where: {
          date: {
            gte: new Date(dateRanges.prevMonthStart.getFullYear(), dateRanges.prevMonthStart.getMonth(), dateRanges.prevMonthStart.getDate()),
            lt: new Date(dateRanges.prevMonthStart.getFullYear(), dateRanges.prevMonthStart.getMonth(), dateRanges.prevMonthStart.getDate() + 1)
          },
          OR: [{ status: 'present' }, { checkin: { not: null } }],
          employee: { status: 'active' }
        },
        select: { employeeId: true },
        distinct: ['employeeId']
      }),
      this.prisma.department.count({
        where: { createdAt: { lt: dateRanges.currentMonthStart } }
      }),
      // Sales dep_manager (all leads, no filtering)
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: 'in_progress' } }),
      this.prisma.crackedLead.count(),
      this.prisma.crackedLead.aggregate({ _sum: { amount: true } }),
      this.prisma.lead.count({ where: { createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.crackedLead.count({ where: { lead: { createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, crackedAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.crackedLead.aggregate({ where: { lead: { createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, crackedAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } }),
      // HR dep_manager
      this.prisma.employee.count({ where: { status: 'active' } }),
      this.getAttendanceRate(),
      this.prisma.leaveLog.count({ where: { status: 'Approved', startDate: { lte: today }, endDate: { gte: today } } }),
      this.prisma.hrRequest.count({ where: { status: 'Pending' } }),
      this.prisma.employee.count({ where: { status: 'active', startDate: { lt: dateRanges.currentMonthStart } } }),
      this.getAttendanceRate(dateRanges.prevMonthStart, dateRanges.currentMonthStart),
      this.prisma.hrRequest.count({ where: { status: 'Pending', requestedOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.leaveLog.count({ where: { status: 'Approved', startDate: { lte: new Date(today.getTime() - 86400000) }, endDate: { gte: new Date(today.getTime() - 86400000) } } }),
      // Production dep_manager
      this.prisma.project.count({ where: { team: { productionUnitId: { not: null } } } }),
      this.prisma.project.count({ where: { team: { productionUnitId: { not: null } }, createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.productionUnit.count(),
      this.prisma.productionUnit.count({ where: { createdAt: { lt: dateRanges.currentMonthStart } } }),
      this.prisma.project.count({ where: { status: 'in_progress', team: { productionUnitId: { not: null } } } }),
      this.prisma.project.count({ where: { status: 'in_progress', team: { productionUnitId: { not: null } }, createdAt: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } } }),
      this.prisma.production.findFirst({
        orderBy: { projectsCompleted: 'desc' },
        select: { projectsCompleted: true, employee: { select: { firstName: true, lastName: true } } }
      }),
      // Accounts dep_manager
      this.prisma.revenue.aggregate({ where: { receivedOn: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { paidOn: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd } }, _sum: { amount: true } }),
      this.prisma.revenue.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.revenue.aggregate({ where: { receivedOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { paidOn: { gte: dateRanges.prevMonthStart, lt: dateRanges.currentMonthStart } }, _sum: { amount: true } })
    ]);

    const activeToday = activeTodayLogs.length;
    const prevActiveToday = prevActiveTodayLogs.length;

    // Calculate active rate
    const totalActiveEmployees = await this.prisma.employee.count({
      where: { status: 'active' }
    });
    const activeRate = totalActiveEmployees > 0 
      ? Math.round((activeToday / totalActiveEmployees) * 100) 
      : 0;

    // System Health
    const systemHealth = 99.9;
    const prevSystemHealth = 99.8;

    // Sales calculations
    const salesConversionRate = salesTotal > 0 ? ((salesCracked / salesTotal) * 100) : 0;
    const salesPrevConversionRate = salesPrevTotal > 0 ? ((salesPrevCracked / salesPrevTotal) * 100) : 0;

    // Accounts calculations
    const accRev = Number(accRevenue._sum.amount || 0);
    const accExp = Number(accExpenses._sum.amount || 0);
    const accProfit = Number(accAllRevenue._sum.amount || 0) - Number(accAllExpenses._sum.amount || 0);
    const accPrevRev = Number(accPrevRevenue._sum.amount || 0);
    const accPrevExp = Number(accPrevExpenses._sum.amount || 0);
    const accCurrentMonthProfit = accRev - accExp;
    const accPrevMonthProfit = accPrevRev - accPrevExp;

    // Combine all cards
    const adminCards = [
      {
        id: 1,
        title: 'Total Users',
        value: totalUsers.toString(),
        subtitle: 'Registered users',
        change: this.calculateChange(totalUsers, prevTotalUsers, 'number'),
        changeType: this.getChangeType(totalUsers, prevTotalUsers, true),
        department: 'Admin'
      },
      {
        id: 2,
        title: 'Active Today',
        value: activeToday.toString(),
        subtitle: 'Currently online',
        change: `${activeRate}% active rate`,
        changeType: (activeRate >= 70 ? 'positive' : activeRate >= 50 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
        department: 'Admin'
      },
      {
        id: 3,
        title: 'Departments',
        value: departments.toString(),
        subtitle: 'Active departments',
        change: departments === prevDepartments ? 'All operational' : this.calculateChange(departments, prevDepartments, 'number'),
        changeType: this.getChangeType(departments, prevDepartments, true),
        department: 'Admin'
      },
      {
        id: 4,
        title: 'System Health',
        value: `${systemHealth}%`,
        subtitle: 'Server uptime',
        change: this.calculateChange(systemHealth, prevSystemHealth, 'percentage'),
        changeType: this.getChangeType(systemHealth, prevSystemHealth, true),
        department: 'Admin'
      }
    ];

    const salesCards = [
      {
        id: 5,
        title: 'Leads',
        value: salesTotal.toString(),
        subtitle: `Active: ${salesActive}`,
        change: this.calculateChange(salesTotal, salesPrevTotal, 'number'),
        changeType: this.getChangeType(salesTotal, salesPrevTotal, true),
        department: 'Sales'
      },
      {
        id: 6,
        title: 'Conversion Rate',
        value: `${salesConversionRate.toFixed(2)}%`,
        subtitle: 'Cracked / Total',
        change: this.calculateChange(salesConversionRate, salesPrevConversionRate, 'percentage'),
        changeType: this.getChangeType(salesConversionRate, salesPrevConversionRate, true),
        department: 'Sales'
      },
      {
        id: 7,
        title: 'Revenue',
        value: `$${this.fmt(Number(salesRevenue._sum.amount || 0))}`,
        subtitle: 'Total revenue',
        change: this.calculateChange(Number(salesRevenue._sum.amount || 0), Number(salesPrevRevenue._sum.amount || 0), 'currency'),
        changeType: this.getChangeType(Number(salesRevenue._sum.amount || 0), Number(salesPrevRevenue._sum.amount || 0), true),
        department: 'Sales'
      },
      {
        id: 8,
        title: 'Won Deals',
        value: salesCracked.toString(),
        subtitle: 'Cracked leads',
        change: this.calculateChange(salesCracked, salesPrevCracked, 'number'),
        changeType: this.getChangeType(salesCracked, salesPrevCracked, true),
        department: 'Sales'
      }
    ];

    const hrCards = [
      {
        id: 9,
        title: 'Employees',
        value: hrEmployees.toString(),
        subtitle: 'Active employees',
        change: this.calculateChange(hrEmployees, hrPrevEmployees, 'number'),
        changeType: this.getChangeType(hrEmployees, hrPrevEmployees, true),
        department: 'HR'
      },
      {
        id: 10,
        title: 'Attendance Rate',
        value: `${hrAttendance}%`,
        subtitle: 'This month',
        change: this.calculateChange(hrAttendance, hrPrevAttendance, 'percentage'),
        changeType: this.getChangeType(hrAttendance, hrPrevAttendance, true),
        department: 'HR'
      },
      {
        id: 11,
        title: 'Request Pending',
        value: hrPending.toString(),
        subtitle: 'All pending',
        change: this.calculateChange(hrPending, hrPrevPending, 'number'),
        changeType: this.getChangeType(hrPending, hrPrevPending, false),
        department: 'HR'
      },
      {
        id: 12,
        title: 'On Leave Today',
        value: hrOnLeave.toString(),
        subtitle: 'Currently on leave',
        change: this.calculateChange(hrOnLeave, hrPrevOnLeave, 'number'),
        changeType: this.getChangeType(hrOnLeave, hrPrevOnLeave, false),
        department: 'HR'
      }
    ];

    const productionCards = [
      {
        id: 13,
        title: 'Total Projects',
        value: prodTotalProjects.toString(),
        subtitle: 'All projects',
        change: this.calculateChange(prodTotalProjects, prodPrevTotalProjects, 'number'),
        changeType: this.getChangeType(prodTotalProjects, prodPrevTotalProjects, true),
        department: 'Production'
      },
      {
        id: 14,
        title: 'Units',
        value: prodProductionUnits.toString(),
        subtitle: 'Total units',
        change: this.calculateChange(prodProductionUnits, prodPrevProductionUnits, 'number'),
        changeType: this.getChangeType(prodProductionUnits, prodPrevProductionUnits, true),
        department: 'Production'
      },
      {
        id: 15,
        title: 'Active Projects',
        value: prodActiveProjects.toString(),
        subtitle: 'In progress',
        change: this.calculateChange(prodActiveProjects, prodPrevActiveProjects, 'number'),
        changeType: this.getChangeType(prodActiveProjects, prodPrevActiveProjects, true),
        department: 'Production'
      },
      {
        id: 16,
        title: 'Most Completed',
        value: (prodMostCompleted?.projectsCompleted || 0).toString(),
        subtitle: prodMostCompleted ? `${prodMostCompleted.employee.firstName} ${prodMostCompleted.employee.lastName}` : 'No data',
        change: prodMostCompleted ? 'Top performer' : 'No Performer',
        changeType: 'neutral' as const,
        department: 'Production'
      }
    ];

    const accountsCards = [
      {
        id: 17,
        title: 'Profit',
        value: this.fmtCurrency(accProfit),
        subtitle: 'All time',
        change: this.calculateChange(accCurrentMonthProfit, accPrevMonthProfit, 'currency'),
        changeType: this.getChangeType(accCurrentMonthProfit, accPrevMonthProfit, true),
        department: 'Accounts'
      },
      {
        id: 18,
        title: 'Expense',
        value: this.fmtCurrency(accExp),
        subtitle: 'This month',
        change: this.calculateChange(accExp, accPrevExp, 'currency'),
        changeType: this.getChangeType(accExp, accPrevExp, false),
        department: 'Accounts'
      },
      {
        id: 19,
        title: 'Cash Flow',
        value: this.fmtCurrency(accRev - accExp),
        subtitle: 'This month',
        change: this.calculateChange(accRev - accExp, accPrevRev - accPrevExp, 'currency'),
        changeType: this.getChangeType(accRev - accExp, accPrevRev - accPrevExp, true),
        department: 'Accounts'
      },
      {
        id: 20,
        title: 'Revenue',
        value: this.fmtCurrency(accRev),
        subtitle: 'This month',
        change: this.calculateChange(accRev, accPrevRev, 'currency'),
        changeType: this.getChangeType(accRev, accPrevRev, true),
        department: 'Accounts'
      }
    ];

    return {
      department: 'Admin',
      role: 'admin',
      cardsByDepartment: {
        Admin: adminCards,
        Sales: salesCards,
        HR: hrCards,
        Production: productionCards,
        Accounts: accountsCards
      }
    };
  }

  // HR REQUESTS - Optimized with single query and direct Prisma relations
  async getHrRequests(userId: number, department: string, role: string, userType?: string, limit: number = 10) {
    // Check if user is Admin
    const isAdmin = userType === 'admin' || !department || department === 'Admin' || role === 'admin';
    
    if (isAdmin) {
      return await this.getAdminRequests(limit);
    }

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

  // ADMIN REQUESTS - Separated HR-to-Admin and Employee-to-HR requests
  private async getAdminRequests(limit: number = 10) {
    // Fetch both types of requests in parallel
    const [adminRequests, hrRequests] = await Promise.all([
      // HR-to-Admin requests (AdminRequest table)
      this.prisma.adminRequest.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          description: true,
          status: true,
          createdAt: true,
          hr: {
            select: {
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
          }
        }
      }),
      // Employee-to-HR requests (HrRequest table) - same as HR users see
      this.prisma.hrRequest.findMany({
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
      })
    ]);

    // Transform HR-to-Admin requests
    const hrToAdminRequests = adminRequests.map(request => ({
      id: request.id.toString(),
      title: this.mapAdminRequestType(request.type) || 'Admin Request',
      employee: request.hr?.employee 
        ? `${request.hr.employee.firstName} ${request.hr.employee.lastName}`
        : 'HR Employee',
      department: request.hr?.employee?.department?.name || 'HR',
      type: this.mapAdminRequestTypeToStandard(request.type),
      status: this.mapAdminRequestStatus(request.status),
      priority: 'Medium' as const, // AdminRequests don't have priority, default to Medium
      submittedDate: this.getRelativeTime(request.createdAt),
      description: request.description || ''
    }));

    // Transform Employee-to-HR requests (exactly same format as HR users see)
    const employeeToHrRequests = hrRequests.map(request => ({
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
      department: 'Admin',
      role: 'admin',
      requestsByType: {
        employeeToHr: employeeToHrRequests,
        hrToAdmin: hrToAdminRequests
      },
      total: employeeToHrRequests.length + hrToAdminRequests.length
    };
  }

  // Helper methods for Admin Requests
  private mapAdminRequestType(type: string | null): string {
    if (!type) return 'Admin Request';
    
    const typeStr = type.toString();
    if (typeStr === 'salary_increase') return 'Salary Increase Request';
    if (typeStr === 'late_approval') return 'Late Approval Request';
    if (typeStr === 'others') return 'Other Request';
    return 'Admin Request';
  }

  private mapAdminRequestTypeToStandard(type: string | null): 'Leave' | 'Salary' | 'Training' | 'Complaint' | 'Other' {
    if (!type) return 'Other';
    
    const typeStr = type.toString();
    if (typeStr === 'salary_increase') return 'Salary';
    if (typeStr === 'late_approval') return 'Leave';
    return 'Other';
  }

  private mapAdminRequestStatus(status: any): 'Pending' | 'Approved' | 'Rejected' | 'Under Review' {
    if (!status) return 'Pending';
    
    const statusStr = status.toString().toLowerCase();
    if (statusStr === 'approved') return 'Approved';
    if (statusStr === 'declined') return 'Rejected';
    if (statusStr === 'pending') return 'Pending';
    return 'Pending';
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

  // ATTENDANCE TRENDS
  async getAttendanceTrends(
    userId: number,
    department: string,
    role: string,
    userType?: string,
    period: 'daily' | 'monthly' = 'daily',
    filterDepartment?: string
  ) {
    // Check if user is Admin
    const isAdmin = userType === 'admin' || !department || department === 'Admin' || role === 'admin';
    
    if (period === 'monthly') {
      return await this.getMonthlyAttendanceTrends(isAdmin, department, filterDepartment);
    } else {
      return await this.getDailyAttendanceTrends(isAdmin, department, filterDepartment);
    }
  }

  private async getDailyAttendanceTrends(isAdmin: boolean, department?: string, filterDepartment?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get last 7 days
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

    // Get previous period for comparison (7 days before)
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - 6);

    if (isAdmin && !filterDepartment) {
      return await this.getAdminDailyTrends(startDate, endDate, prevStartDate, prevEndDate);
    }

    // Department-specific view
    const targetDept = filterDepartment || department;
    if (!targetDept) {
      throw new Error('Department is required for non-admin users');
    }
    return await this.getDepartmentDailyTrends(targetDept, startDate, endDate, prevStartDate, prevEndDate);
  }

  private async getAdminDailyTrends(
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date
  ) {
    // Get all departments
    const departments = await this.prisma.department.findMany({
      where: { name: { not: 'Admin' } },
      select: { name: true }
    });

    const deptNames = departments.map(d => d.name);
    
    // Get all employees by department
    const employeesByDept = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: {
        status: 'active',
        department: { name: { in: deptNames } }
      },
      _count: true
    });

    const deptMap = new Map<number, string>();
    for (const dept of departments) {
      const deptRecord = await this.prisma.department.findFirst({ where: { name: dept.name } });
      if (deptRecord) deptMap.set(deptRecord.id, dept.name);
    }

    // Get attendance logs for all departments
    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        employee: {
          status: 'active',
          department: { name: { in: deptNames } }
        }
      },
      include: {
        employee: {
          include: { department: { select: { name: true } } }
        }
      }
    });

    const prevAttendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        date: { gte: prevStartDate, lte: prevEndDate },
        employee: {
          status: 'active',
          department: { name: { in: deptNames } }
        }
      },
      include: {
        employee: {
          include: { department: { select: { name: true } } }
        }
      }
    });

    // Get leave logs for context
    const leaveLogs = await this.prisma.leaveLog.findMany({
      where: {
        status: 'Approved',
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } }
        ]
      },
      include: {
        employee: {
          include: { department: { select: { name: true } } }
        }
      }
    });

    // Process data by date
    const dataMap = new Map<string, any>();
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'active', department: { name: { in: deptNames } } }
    });

    // Initialize all dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      dataMap.set(dateKey, {
        date: dateKey,
        present: 0,
        absent: 0,
        onLeave: 0,
        remote: 0,
        late: 0,
        byDepartment: {} as Record<string, any>,
        isWeekend,
        isHoliday: false
      });
    }

    // Process current period attendance
    attendanceLogs.forEach(log => {
      if (!log.date) return;
      const dateKey = log.date.toISOString().split('T')[0];
      const data = dataMap.get(dateKey);
      if (!data) return;

      const deptName = log.employee.department.name;
      if (!data.byDepartment[deptName]) {
        data.byDepartment[deptName] = { present: 0, absent: 0, employees: 0 };
      }

      if (log.status === 'present' || log.checkin) {
        data.present++;
        data.byDepartment[deptName].present++;
      } else {
        data.absent++;
        data.byDepartment[deptName].absent++;
      }

      if (log.mode === 'remote') {
        data.remote++;
      }
    });

    // Process leave logs
    leaveLogs.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const startTime = Math.max(start.getTime(), startDate.getTime());
      const endTime = Math.min(end.getTime(), endDate.getTime());
      
      for (let d = new Date(startTime); d.getTime() <= endTime; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const data = dataMap.get(dateKey);
        if (data) {
          data.onLeave++;
        }
      }
    });

    // Get department employee counts
    const deptEmployeeCounts = new Map<string, number>();
    for (const dept of departments) {
      const count = await this.prisma.employee.count({
        where: { status: 'active', department: { name: dept.name } }
      });
      deptEmployeeCounts.set(dept.name, count);
    }

    // Build response data
    const data: any[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let bestDay: { date: string; rate: number } | undefined;
    let worstDay: { date: string; rate: number } | undefined;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = dataMap.get(dateKey);
      if (!dayData) continue;

      const present = dayData.present;
      const absent = dayData.absent;
      const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100 * 100) / 100 : 0;

      if (!bestDay || attendanceRate > bestDay.rate) {
        bestDay = { date: dateKey, rate: attendanceRate };
      }
      if (!worstDay || attendanceRate < worstDay.rate) {
        worstDay = { date: dateKey, rate: attendanceRate };
      }

      totalPresent += present;
      totalAbsent += absent;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = dayNames[d.getDay()];
      const monthName = monthNames[d.getMonth()];
      const dayNum = d.getDate();

      // Build department breakdown
      const byDept: Record<string, any> = {};
      for (const [deptName, deptData] of Object.entries(dayData.byDepartment)) {
        const deptTotal = deptEmployeeCounts.get(deptName) || 0;
        const deptDataTyped = deptData as { present: number; absent: number; employees?: number };
        byDept[deptName] = {
          rate: deptTotal > 0 ? Math.round((deptDataTyped.present / deptTotal) * 100 * 100) / 100 : 0,
          present: deptDataTyped.present,
          absent: deptDataTyped.absent,
          employees: deptTotal
        };
      }

      data.push({
        date: dateKey,
        label: dayName,
        fullLabel: `${dayName}, ${monthName} ${dayNum}`,
        attendanceRate,
        totalEmployees,
        present,
        absent: absent,
        onLeave: dayData.onLeave || 0,
        remote: dayData.remote || 0,
        late: dayData.late || 0,
        chartValue: attendanceRate,
        isWeekend: dayData.isWeekend,
        isHoliday: dayData.isHoliday,
        byDepartment: byDept
      });
    }

    // Calculate previous period for comparison
    const prevDataMap = new Map<string, any>();
    for (let d = new Date(prevStartDate); d <= prevEndDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      prevDataMap.set(dateKey, { present: 0, absent: 0 });
    }

    prevAttendanceLogs.forEach(log => {
      if (!log.date) return;
      const dateKey = log.date.toISOString().split('T')[0];
      const prevData = prevDataMap.get(dateKey);
      if (prevData) {
        if (log.status === 'present' || log.checkin) {
          prevData.present++;
        } else {
          prevData.absent++;
        }
      }
    });

    let prevTotalPresent = 0;
    let prevTotalAbsent = 0;
    prevDataMap.forEach(prevData => {
      prevTotalPresent += prevData.present;
      prevTotalAbsent += prevData.absent;
    });

    const avgRate = data.length > 0 
      ? Math.round((data.reduce((sum, d) => sum + d.attendanceRate, 0) / data.length) * 100) / 100
      : 0;
    const prevAvgRate = totalEmployees > 0
      ? Math.round((prevTotalPresent / (prevTotalPresent + prevTotalAbsent)) * 100 * 100) / 100
      : 0;
    const change = avgRate - prevAvgRate;
    const changePercent = prevAvgRate > 0 ? Math.round((change / prevAvgRate) * 100 * 100) / 100 : 0;

    // Calculate department summaries
    const deptSummaries: Record<string, { rate: number; employees: number }> = {};
    for (const [deptName, count] of deptEmployeeCounts.entries()) {
      const deptPresent = data.reduce((sum, d) => sum + (d.byDepartment[deptName]?.present || 0), 0);
      const deptAvgPresent = deptPresent / data.length;
      const deptRate = count > 0 ? Math.round((deptAvgPresent / count) * 100 * 100) / 100 : 0;
      deptSummaries[deptName] = { rate: deptRate, employees: count };
    }

    return {
      department: 'Admin',
      role: 'admin',
      period: 'daily' as const,
      summary: {
        overall: {
          averageAttendanceRate: avgRate,
          totalEmployees,
          averagePresent: Math.round(totalPresent / data.length),
          averageAbsent: Math.round(totalAbsent / data.length),
          bestDay,
          worstDay
        },
        byDepartment: deptSummaries
      },
      data,
      metadata: {
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totalDays: data.length,
        workingDays: data.filter(d => !d.isWeekend).length,
        weekendDays: data.filter(d => d.isWeekend).length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async getDepartmentDailyTrends(
    department: string,
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date
  ) {
    // Get employees in department
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'active', department: { name: department } }
    });

    // Get attendance logs
    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        employee: {
          status: 'active',
          department: { name: department }
        }
      }
    });

    const prevAttendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        date: { gte: prevStartDate, lte: prevEndDate },
        employee: {
          status: 'active',
          department: { name: department }
        }
      }
    });

    // Get leave logs
    const leaveLogs = await this.prisma.leaveLog.findMany({
      where: {
        status: 'Approved',
        employee: { department: { name: department } },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } }
        ]
      }
    });

    // Process data by date
    const dataMap = new Map<string, any>();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      dataMap.set(dateKey, {
        present: 0,
        absent: 0,
        onLeave: 0,
        remote: 0,
        late: 0,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: false
      });
    }

    attendanceLogs.forEach(log => {
      if (!log.date) return;
      const dateKey = log.date.toISOString().split('T')[0];
      const data = dataMap.get(dateKey);
      if (!data) return;

      if (log.status === 'present' || log.checkin) {
        data.present++;
      } else {
        data.absent++;
      }

      if (log.mode === 'remote') {
        data.remote++;
      }
    });

    leaveLogs.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const startTime = Math.max(start.getTime(), startDate.getTime());
      const endTime = Math.min(end.getTime(), endDate.getTime());
      
      for (let d = new Date(startTime); d.getTime() <= endTime; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const data = dataMap.get(dateKey);
        if (data) {
          data.onLeave++;
        }
      }
    });

    // Build response data
    const data: any[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let bestDay: { date: string; rate: number } | undefined;
    let worstDay: { date: string; rate: number } | undefined;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const dayData = dataMap.get(dateKey);
      if (!dayData) continue;

      const present = dayData.present;
      const absent = dayData.absent;
      const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100 * 100) / 100 : 0;

      if (!bestDay || attendanceRate > bestDay.rate) {
        bestDay = { date: dateKey, rate: attendanceRate };
      }
      if (!worstDay || attendanceRate < worstDay.rate) {
        worstDay = { date: dateKey, rate: attendanceRate };
      }

      totalPresent += present;
      totalAbsent += absent;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = dayNames[d.getDay()];
      const monthName = monthNames[d.getMonth()];
      const dayNum = d.getDate();

      data.push({
        date: dateKey,
        label: dayName,
        fullLabel: `${dayName}, ${monthName} ${dayNum}`,
        attendanceRate,
        totalEmployees,
        present,
        absent,
        onLeave: dayData.onLeave || 0,
        remote: dayData.remote || 0,
        late: dayData.late || 0,
        chartValue: attendanceRate,
        isWeekend: dayData.isWeekend,
        isHoliday: dayData.isHoliday
      });
    }

    // Calculate previous period
    const prevDataMap = new Map<string, any>();
    for (let d = new Date(prevStartDate); d <= prevEndDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      prevDataMap.set(dateKey, { present: 0, absent: 0 });
    }

    prevAttendanceLogs.forEach(log => {
      if (!log.date) return;
      const dateKey = log.date.toISOString().split('T')[0];
      const prevData = prevDataMap.get(dateKey);
      if (prevData) {
        if (log.status === 'present' || log.checkin) {
          prevData.present++;
        } else {
          prevData.absent++;
        }
      }
    });

    let prevTotalPresent = 0;
    let prevTotalAbsent = 0;
    prevDataMap.forEach(prevData => {
      prevTotalPresent += prevData.present;
      prevTotalAbsent += prevData.absent;
    });

    const avgRate = data.length > 0 
      ? Math.round((data.reduce((sum, d) => sum + d.attendanceRate, 0) / data.length) * 100) / 100
      : 0;
    const prevAvgRate = totalEmployees > 0
      ? Math.round((prevTotalPresent / (prevTotalPresent + prevTotalAbsent)) * 100 * 100) / 100
      : 0;
    const change = avgRate - prevAvgRate;
    const changePercent = prevAvgRate > 0 ? Math.round((change / prevAvgRate) * 100 * 100) / 100 : 0;

    return {
      department,
      role: 'dep_manager',
      period: 'daily' as const,
      summary: {
        currentPeriod: {
          averageAttendanceRate: avgRate,
          totalEmployees,
          averagePresent: Math.round(totalPresent / data.length),
          averageAbsent: Math.round(totalAbsent / data.length),
          bestDay,
          worstDay
        },
        previousPeriod: {
          averageAttendanceRate: prevAvgRate,
          totalEmployees,
          averagePresent: Math.round(prevTotalPresent / prevDataMap.size),
          averageAbsent: Math.round(prevTotalAbsent / prevDataMap.size)
        },
        change: {
          rate: change,
          trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
          percentage: changePercent
        }
      },
      data,
      metadata: {
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totalDays: data.length,
        workingDays: data.filter(d => !d.isWeekend).length,
        weekendDays: data.filter(d => d.isWeekend).length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async getMonthlyAttendanceTrends(isAdmin: boolean, department?: string, filterDepartment?: string) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Get last 12 months
    const months: { year: number; month: number; monthStr: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.push({
        year,
        month,
        monthStr: `${year}-${String(month).padStart(2, '0')}`
      });
    }

    if (isAdmin && !filterDepartment) {
      return await this.getAdminMonthlyTrends(months);
    }

    const targetDept = filterDepartment || department;
    if (!targetDept) {
      throw new Error('Department is required for non-admin users');
    }
    return await this.getDepartmentMonthlyTrends(targetDept, months);
  }

  private async getAdminMonthlyTrends(months: { year: number; month: number; monthStr: string }[]) {
    const departments = await this.prisma.department.findMany({
      where: { name: { not: 'Admin' } },
      select: { name: true }
    });

    const deptNames = departments.map(d => d.name);
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'active', department: { name: { in: deptNames } } }
    });

    // Get monthly summaries for all departments
    const summaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        month: { in: months.map(m => m.monthStr) },
        employee: {
          status: 'active',
          department: { name: { in: deptNames } }
        }
      },
      include: {
        employee: {
          include: { department: { select: { name: true } } }
        }
      }
    });

    // Process data by month
    const data: any[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let bestMonth: { date: string; rate: number } | undefined;
    let worstMonth: { date: string; rate: number } | undefined;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const monthInfo of months) {
      const monthSummaries = summaries.filter(s => s.month === monthInfo.monthStr);
      
      let monthPresent = 0;
      let monthAbsent = 0;
      const deptBreakdown: Record<string, any> = {};

      monthSummaries.forEach(summary => {
        const deptName = summary.employee.department.name;
        monthPresent += summary.totalPresent;
        monthAbsent += summary.totalAbsent;

        if (!deptBreakdown[deptName]) {
          deptBreakdown[deptName] = { present: 0, absent: 0 };
        }
        deptBreakdown[deptName].present += summary.totalPresent;
        deptBreakdown[deptName].absent += summary.totalAbsent;
      });

      const attendanceRate = totalEmployees > 0 
        ? Math.round((monthPresent / (monthPresent + monthAbsent)) * 100 * 100) / 100 
        : 0;

      if (!bestMonth || attendanceRate > bestMonth.rate) {
        bestMonth = { date: monthInfo.monthStr, rate: attendanceRate };
      }
      if (!worstMonth || attendanceRate < worstMonth.rate) {
        worstMonth = { date: monthInfo.monthStr, rate: attendanceRate };
      }

      totalPresent += monthPresent;
      totalAbsent += monthAbsent;

      // Calculate department rates
      const deptRates: Record<string, any> = {};
      for (const [deptName, deptData] of Object.entries(deptBreakdown)) {
        const deptTotal = await this.prisma.employee.count({
          where: { status: 'active', department: { name: deptName } }
        });
        const deptRate = deptTotal > 0 
          ? Math.round((deptData.present / (deptData.present + deptData.absent)) * 100 * 100) / 100 
          : 0;
        deptRates[deptName] = {
          rate: deptRate,
          present: deptData.present,
          absent: deptData.absent,
          employees: deptTotal
        };
      }

      data.push({
        date: monthInfo.monthStr,
        label: monthNames[monthInfo.month - 1],
        fullLabel: `${monthNames[monthInfo.month - 1]} ${monthInfo.year}`,
        monthNumber: monthInfo.month,
        year: monthInfo.year,
        attendanceRate,
        totalEmployees,
        totalPresent: monthPresent,
        totalAbsent: monthAbsent,
        totalOnLeave: 0, // Would need leave data
        totalRemote: 0, // Would need remote data
        totalLate: 0, // Would need late data
        workingDays: 22, // Approximate
        chartValue: attendanceRate,
        byDepartment: deptRates
      });
    }

    const avgRate = data.length > 0 
      ? Math.round((data.reduce((sum, d) => sum + d.attendanceRate, 0) / data.length) * 100) / 100
      : 0;

    // Previous period (12 months before)
    const prevMonths = months.map(m => {
      const date = new Date(m.year, m.month - 1 - 12, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      };
    });

    const prevSummaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        month: { in: prevMonths.map(m => m.monthStr) },
        employee: {
          status: 'active',
          department: { name: { in: deptNames } }
        }
      }
    });

    let prevTotalPresent = 0;
    let prevTotalAbsent = 0;
    prevSummaries.forEach(s => {
      prevTotalPresent += s.totalPresent;
      prevTotalAbsent += s.totalAbsent;
    });

    const prevAvgRate = totalEmployees > 0
      ? Math.round((prevTotalPresent / (prevTotalPresent + prevTotalAbsent)) * 100 * 100) / 100
      : 0;
    const change = avgRate - prevAvgRate;
    const changePercent = prevAvgRate > 0 ? Math.round((change / prevAvgRate) * 100 * 100) / 100 : 0;

    // Department summaries
    const deptSummaries: Record<string, { rate: number; employees: number }> = {};
    for (const dept of departments) {
      const deptPresent = data.reduce((sum, d) => sum + (d.byDepartment[dept.name]?.present || 0), 0);
      const deptAbsent = data.reduce((sum, d) => sum + (d.byDepartment[dept.name]?.absent || 0), 0);
      const deptTotal = await this.prisma.employee.count({
        where: { status: 'active', department: { name: dept.name } }
      });
      const deptRate = (deptPresent + deptAbsent) > 0 
        ? Math.round((deptPresent / (deptPresent + deptAbsent)) * 100 * 100) / 100 
        : 0;
      deptSummaries[dept.name] = { rate: deptRate, employees: deptTotal };
    }

    return {
      department: 'Admin',
      role: 'admin',
      period: 'monthly' as const,
      summary: {
        overall: {
          averageAttendanceRate: avgRate,
          totalEmployees,
          averagePresent: Math.round(totalPresent / data.length),
          averageAbsent: Math.round(totalAbsent / data.length),
          bestDay: bestMonth,
          worstDay: worstMonth
        },
        byDepartment: deptSummaries
      },
      data,
      metadata: {
        dateRange: {
          start: months[0].monthStr,
          end: months[months.length - 1].monthStr
        },
        totalMonths: data.length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async getDepartmentMonthlyTrends(
    department: string,
    months: { year: number; month: number; monthStr: string }[]
  ) {
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'active', department: { name: department } }
    });

    const summaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        month: { in: months.map(m => m.monthStr) },
        employee: {
          status: 'active',
          department: { name: department }
        }
      }
    });

    const data: any[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let bestMonth: { date: string; rate: number } | undefined;
    let worstMonth: { date: string; rate: number } | undefined;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const monthInfo of months) {
      const monthSummaries = summaries.filter(s => s.month === monthInfo.monthStr);
      
      let monthPresent = monthSummaries.reduce((sum, s) => sum + s.totalPresent, 0);
      let monthAbsent = monthSummaries.reduce((sum, s) => sum + s.totalAbsent, 0);
      let monthLeave = monthSummaries.reduce((sum, s) => sum + s.totalLeaveDays, 0);
      let monthLate = monthSummaries.reduce((sum, s) => sum + s.totalLateDays, 0);
      let monthRemote = monthSummaries.reduce((sum, s) => sum + s.totalRemoteDays, 0);

      const attendanceRate = totalEmployees > 0 
        ? Math.round((monthPresent / (monthPresent + monthAbsent)) * 100 * 100) / 100 
        : 0;

      if (!bestMonth || attendanceRate > bestMonth.rate) {
        bestMonth = { date: monthInfo.monthStr, rate: attendanceRate };
      }
      if (!worstMonth || attendanceRate < worstMonth.rate) {
        worstMonth = { date: monthInfo.monthStr, rate: attendanceRate };
      }

      totalPresent += monthPresent;
      totalAbsent += monthAbsent;

      data.push({
        date: monthInfo.monthStr,
        label: monthNames[monthInfo.month - 1],
        fullLabel: `${monthNames[monthInfo.month - 1]} ${monthInfo.year}`,
        monthNumber: monthInfo.month,
        year: monthInfo.year,
        attendanceRate,
        totalEmployees,
        totalPresent: monthPresent,
        totalAbsent: monthAbsent,
        totalOnLeave: monthLeave,
        totalRemote: monthRemote,
        totalLate: monthLate,
        workingDays: 22, // Approximate
        chartValue: attendanceRate
      });
    }

    const avgRate = data.length > 0 
      ? Math.round((data.reduce((sum, d) => sum + d.attendanceRate, 0) / data.length) * 100) / 100
      : 0;

    // Previous period
    const prevMonths = months.map(m => {
      const date = new Date(m.year, m.month - 1 - 12, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      };
    });

    const prevSummaries = await this.prisma.monthlyAttendanceSummary.findMany({
      where: {
        month: { in: prevMonths.map(m => m.monthStr) },
        employee: {
          status: 'active',
          department: { name: department }
        }
      }
    });

    let prevTotalPresent = prevSummaries.reduce((sum, s) => sum + s.totalPresent, 0);
    let prevTotalAbsent = prevSummaries.reduce((sum, s) => sum + s.totalAbsent, 0);

    const prevAvgRate = totalEmployees > 0
      ? Math.round((prevTotalPresent / (prevTotalPresent + prevTotalAbsent)) * 100 * 100) / 100
      : 0;
    const change = avgRate - prevAvgRate;
    const changePercent = prevAvgRate > 0 ? Math.round((change / prevAvgRate) * 100 * 100) / 100 : 0;

    return {
      department,
      role: 'dep_manager',
      period: 'monthly' as const,
      summary: {
        currentPeriod: {
          averageAttendanceRate: avgRate,
          totalEmployees,
          averagePresent: Math.round(totalPresent / data.length),
          averageAbsent: Math.round(totalAbsent / data.length),
          bestDay: bestMonth,
          worstDay: worstMonth
        },
        previousPeriod: {
          averageAttendanceRate: prevAvgRate,
          totalEmployees,
          averagePresent: Math.round(prevTotalPresent / prevMonths.length),
          averageAbsent: Math.round(prevTotalAbsent / prevMonths.length)
        },
        change: {
          rate: change,
          trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
          percentage: changePercent
        }
      },
      data,
      metadata: {
        dateRange: {
          start: months[0].monthStr,
          end: months[months.length - 1].monthStr
        },
        totalMonths: data.length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  // EMPLOYEE COUNT BY DEPARTMENT
  async getEmployeeCountByDepartment() {
    // Get all departments (excluding Admin)
    const departments = await this.prisma.department.findMany({
      where: { name: { not: 'Admin' } },
      select: { id: true, name: true }
    });

    // Get employee counts by department
    const employeeCounts = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: {
        status: 'active' // Only count active employees
      },
      _count: {
        id: true
      }
    });

    // Create a map of department ID to count
    const countMap = new Map<number, number>();
    employeeCounts.forEach(item => {
      countMap.set(item.departmentId, item._count.id);
    });

    // Build response with department names and counts
    const departmentsWithCounts = departments.map(dept => ({
      department: dept.name,
      count: countMap.get(dept.id) || 0
    }));

    // Calculate total
    const total = departmentsWithCounts.reduce((sum, dept) => sum + dept.count, 0);

    return {
      departments: departmentsWithCounts,
      total
    };
  }

  async getCurrentProjects(userId: number, role: string, department: string, userType?: string) {
    // Handle Admin users - they can see all Production projects
    if (userType === 'admin') {
      // Admin sees all Production projects (same as manager) - no filter needed
      const projectWhere = {};
      
      // Get running projects (in_progress, onhold, or null/pending_assignment)
      const runningProjects = await this.prisma.project.findMany({
        where: {
          ...projectWhere,
          OR: [
            { status: { in: ['in_progress', 'onhold'] } },
            { status: null } // Include pending_assignment projects as running
          ]
        } as any,
        select: {
          id: true,
          description: true,
          liveProgress: true,
          status: true,
          deadline: true,
          team: {
            select: {
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Get completed projects if needed
      const remainingSlots = 5 - runningProjects.length;
      let completedProjects: any[] = [];
      if (remainingSlots > 0) {
        completedProjects = await this.prisma.project.findMany({
          where: {
            ...projectWhere,
            status: 'completed'
          },
          select: {
            id: true,
            description: true,
            liveProgress: true,
            status: true,
            deadline: true,
            team: {
              select: {
                name: true
              }
            }
          },
          take: remainingSlots,
          orderBy: { updatedAt: 'desc' }
        });
      }

      const allProjects = [...runningProjects, ...completedProjects].slice(0, 5);
      return this.mapProjectsToResponse(allProjects);
    }

    // Only Production department has projects
    if (department !== 'Production') {
      return { projects: [] };
    }

    let runningProjects: any[] = [];
    let completedProjects: any[] = [];

    // Build where clause based on role
    let projectWhere: any = {};

    if (role === 'unit_head') {
      projectWhere = { unitHeadId: userId };
    } else if (role === 'team_lead') {
      const teams = await this.prisma.team.findMany({
        where: { teamLeadId: userId },
        select: { id: true }
      });
      const teamIds = teams.map(t => t.id);
      projectWhere = teamIds.length > 0 ? { teamId: { in: teamIds } } : { teamId: -1 };
    } else if (role === 'dep_manager') {
      // Department manager can see all Production projects (with or without teams)
      // No filter needed - they see all Production projects
      projectWhere = {};
    } else if (role === 'senior' || role === 'junior') {
      // For senior/junior: Get their team's current project or projects they're working on
      const employee = await this.prisma.employee.findUnique({
        where: { id: userId },
        select: { teamLeadId: true }
      });

      if (employee?.teamLeadId) {
        const team = await this.prisma.team.findFirst({
          where: { teamLeadId: employee.teamLeadId },
          select: { id: true }
        });
        if (team) {
          projectWhere = { teamId: team.id };
        } else {
          projectWhere = { projectLogs: { some: { developerId: userId } } };
        }
      } else {
        projectWhere = { projectLogs: { some: { developerId: userId } } };
      }
    } else {
      // For other roles, return empty
      return { projects: [] };
    }

    // Get running projects (in_progress, onhold, or null/pending_assignment)
    runningProjects = await this.prisma.project.findMany({
      where: {
        ...projectWhere,
        OR: [
          { status: { in: ['in_progress', 'onhold'] } },
          { status: null } // Include pending_assignment projects as running
        ]
      } as any,
      select: {
        id: true,
        description: true,
        liveProgress: true,
        status: true,
        deadline: true,
        team: {
          select: {
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // If we have less than 5 running projects, get completed projects to fill up to 5
    const remainingSlots = 5 - runningProjects.length;
    if (remainingSlots > 0) {
      completedProjects = await this.prisma.project.findMany({
        where: {
          ...projectWhere,
          status: 'completed'
        },
        select: {
          id: true,
          description: true,
          liveProgress: true,
          status: true,
          deadline: true,
          team: {
            select: {
              name: true
            }
          }
        },
        take: remainingSlots,
        orderBy: { updatedAt: 'desc' } // Most recent completed first
      });
    }

    // Combine: running projects first, then completed projects
    const allProjects = [...runningProjects, ...completedProjects].slice(0, 5);

    return this.mapProjectsToResponse(allProjects);
  }

  private mapProjectsToResponse(projects: any[]): { projects: any[] } {
    const mappedProjects = projects.map(project => {
      const progress = project.liveProgress ? Number(project.liveProgress) : 0;
      const deadline = project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
      
      // Determine status based on progress and deadline
      let status: 'on-track' | 'ahead' | 'delayed' = 'on-track';
      
      // For completed projects, set status based on completion
      if (project.status === 'completed') {
        status = 'on-track'; // Completed projects are considered on-track
      } else if (project.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(project.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate expected progress (assuming 30 days project timeline as baseline)
        const daysSinceStart = 30 - daysUntilDeadline;
        const expectedProgress = Math.max(0, Math.min(100, (daysSinceStart / 30) * 100));
        
        if (progress >= expectedProgress + 10) {
          status = 'ahead';
        } else if (progress < expectedProgress - 10 || daysUntilDeadline < 0) {
          status = 'delayed';
        } else {
          status = 'on-track';
        }
      } else {
        // If no deadline, use database status as fallback
        if (project.status === 'onhold') {
          status = 'delayed';
        } else {
          status = 'on-track';
        }
      }

      return {
        name: project.description || `Project ${project.id}`,
        progress: project.status === 'completed' ? 100 : Math.round(progress),
        status,
        deadline,
        team: project.team?.name || 'Unassigned Team'
      };
    });

    return { projects: mappedProjects };
  }

  // SALES TRENDS
  async getSalesTrends(
    userId: number,
    department: string,
    role: string,
    userType: string | undefined,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    fromDate?: string,
    toDate?: string,
    unit?: string
  ) {
    // Check if user is in Sales department
    if (department !== 'Sales' && userType !== 'admin') {
      throw new ForbiddenException('Access denied. Only Sales department users can access sales trends.');
    }

    // Get user's sales department info for hierarchical filtering
    const userSalesDept = await this.prisma.salesDepartment.findFirst({
      where: { employeeId: userId },
      include: {
        salesUnit: {
          select: {
            id: true,
            name: true,
            headId: true,
            teams: {
              select: {
                id: true,
                teamLeadId: true
              }
            }
          }
        }
      }
    });

    // Build hierarchical filters based on role
    const leadFilters = await this.getSalesHierarchicalFilters(role, userId, userSalesDept, unit);

    // Calculate date range
    const dateRange = this.calculateSalesDateRange(period, fromDate, toDate);
    const { startDate, endDate, prevStartDate, prevEndDate } = dateRange;

    // Get all leads in the date range for conversion rate calculation
    const allLeadsWhere = {
      ...leadFilters,
      createdAt: { gte: startDate, lte: endDate }
    };

    // Get cracked leads (closed/won deals) in the date range
    const crackedLeadsWhere = {
      lead: {
        ...leadFilters
      },
      crackedAt: { gte: startDate, lte: endDate }
    };

    // Fetch data
    const [allLeads, crackedLeads, prevAllLeads, prevCrackedLeads] = await Promise.all([
      this.prisma.lead.findMany({
        where: allLeadsWhere,
        select: { id: true, createdAt: true }
      }),
      this.prisma.crackedLead.findMany({
        where: crackedLeadsWhere,
        select: {
          id: true,
          amount: true,
          crackedAt: true,
          lead: {
            select: {
              createdAt: true
            }
          }
        }
      }),
      // Previous period data
      this.prisma.lead.findMany({
        where: {
          ...leadFilters,
          createdAt: { gte: prevStartDate, lte: prevEndDate }
        },
        select: { id: true }
      }),
      this.prisma.crackedLead.findMany({
        where: {
          lead: {
            ...leadFilters
          },
          crackedAt: { gte: prevStartDate, lte: prevEndDate }
        },
        select: {
          id: true,
          amount: true
        }
      })
    ]);

    // Group data by period
    const data = this.groupSalesDataByPeriod(
      crackedLeads,
      allLeads,
      period,
      startDate,
      endDate
    );

    // Calculate summary statistics
    const currentRevenue = crackedLeads.reduce((sum, cl) => sum + Number(cl.amount || 0), 0);
    const currentDeals = crackedLeads.length;
    const currentTotalLeads = allLeads.length;
    const currentConversionRate = currentTotalLeads > 0 ? (currentDeals / currentTotalLeads) * 100 : 0;
    const currentAvgDealSize = currentDeals > 0 ? currentRevenue / currentDeals : 0;

    const prevRevenue = prevCrackedLeads.reduce((sum, cl) => sum + Number(cl.amount || 0), 0);
    const prevDeals = prevCrackedLeads.length;
    const prevTotalLeads = prevAllLeads.length;
    const prevConversionRate = prevTotalLeads > 0 ? (prevDeals / prevTotalLeads) * 100 : 0;
    const prevAvgDealSize = prevDeals > 0 ? prevRevenue / prevDeals : 0;

    // Find best and worst periods
    let bestPeriod: { date: string; revenue: number; label: string } | undefined;
    let worstPeriod: { date: string; revenue: number; label: string } | undefined;

    data.forEach(point => {
      if (!bestPeriod || point.revenue > bestPeriod.revenue) {
        bestPeriod = {
          date: point.date,
          revenue: point.revenue,
          label: point.fullLabel
        };
      }
      if (!worstPeriod || point.revenue < worstPeriod.revenue) {
        worstPeriod = {
          date: point.date,
          revenue: point.revenue,
          label: point.fullLabel
        };
      }
    });

    // Calculate changes
    const revenueChange = currentRevenue - prevRevenue;
    const revenueChangePercent = prevRevenue > 0 ? (revenueChange / prevRevenue) * 100 : 0;
    const dealsChange = currentDeals - prevDeals;
    const dealsChangePercent = prevDeals > 0 ? (dealsChange / prevDeals) * 100 : 0;
    const trend = revenueChange > 0 ? 'up' as const : revenueChange < 0 ? 'down' as const : 'neutral' as const;

    // Build metadata
    const metadata = this.buildSalesMetadata(period, startDate, endDate, data.length);

    return {
      status: 'success',
      department: 'Sales',
      role,
      period,
      summary: {
        currentPeriod: {
          totalRevenue: Math.round(currentRevenue),
          totalDeals: currentDeals,
          averageDealSize: Math.round(currentAvgDealSize),
          conversionRate: Math.round(currentConversionRate * 100) / 100,
          bestMonth: bestPeriod,
          worstMonth: worstPeriod
        },
        previousPeriod: {
          totalRevenue: Math.round(prevRevenue),
          totalDeals: prevDeals,
          averageDealSize: Math.round(prevAvgDealSize),
          conversionRate: Math.round(prevConversionRate * 100) / 100
        },
        change: {
          revenue: Math.round(revenueChange),
          revenuePercentage: Math.round(revenueChangePercent * 100) / 100,
          deals: dealsChange,
          dealsPercentage: Math.round(dealsChangePercent * 100) / 100,
          trend
        }
      },
      data,
      metadata
    };
  }

  private async getSalesHierarchicalFilters(
    role: string,
    userId: number,
    userSalesDept: any,
    unitFilter?: string
  ): Promise<any> {
    // Admin and dep_manager can see all (unless unit filter is specified)
    if (role === 'dep_manager' || role === 'admin') {
      if (unitFilter) {
        // Find unit by name
        const unit = await this.prisma.salesUnit.findFirst({
          where: { name: unitFilter }
        });
        if (unit) {
          return { salesUnitId: unit.id };
        }
      }
      return {}; // No restrictions
    }

    if (!userSalesDept) {
      return { id: -1 }; // No access if not in sales department
    }

    const { salesUnitId, salesUnit } = userSalesDept;

    switch (role) {
      case 'unit_head':
        return { salesUnitId };

      case 'team_lead':
        // Get team members
        const teamMembers = await this.prisma.employee.findMany({
          where: { teamLeadId: userId },
          select: { id: true }
        });
        const teamMemberIds = teamMembers.map(m => m.id);
        return {
          salesUnitId,
          assignedToId: { in: [...teamMemberIds, userId] }
        };

      case 'senior':
      case 'junior':
        return {
          salesUnitId,
          assignedToId: userId
        };

      default:
        return { id: -1 }; // No access
    }
  }

  private calculateSalesDateRange(
    period: string,
    fromDate?: string,
    toDate?: string
  ): { startDate: Date; endDate: Date; prevStartDate: Date; prevEndDate: Date } {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let startDate: Date;
    let endDate: Date = now;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default ranges based on period
      switch (period) {
        case 'daily':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29); // Last 30 days
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - (11 * 7)); // Last 12 weeks
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Last 12 months
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'quarterly':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear() - 1, currentQuarter * 3, 1); // Last 4 quarters
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear() - 4, 0, 1); // Last 5 years
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    // Calculate previous period (same duration before startDate)
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    return { startDate, endDate, prevStartDate, prevEndDate };
  }

  private groupSalesDataByPeriod(
    crackedLeads: any[],
    allLeads: any[],
    period: string,
    startDate: Date,
    endDate: Date
  ): any[] {
    const dataMap = new Map<string, { revenue: number; deals: number; leads: number }>();

    // Initialize data map with all periods
    const periods = this.generatePeriods(period, startDate, endDate);
    periods.forEach(p => {
      dataMap.set(p.key, { revenue: 0, deals: 0, leads: 0 });
    });

    // Aggregate cracked leads (deals)
    crackedLeads.forEach(cl => {
      if (!cl.crackedAt) return;
      const periodKey = this.getPeriodKey(cl.crackedAt, period);
      const data = dataMap.get(periodKey);
      if (data) {
        data.revenue += Number(cl.amount || 0);
        data.deals += 1;
      }
    });

    // Aggregate all leads for conversion rate
    allLeads.forEach(lead => {
      if (!lead.createdAt) return;
      const periodKey = this.getPeriodKey(lead.createdAt, period);
      const data = dataMap.get(periodKey);
      if (data) {
        data.leads += 1;
      }
    });

    // Convert to array and format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: any[] = [];

    periods.forEach(periodInfo => {
      const periodData = dataMap.get(periodInfo.key);
      if (!periodData) return;

      const revenue = periodData.revenue;
      const deals = periodData.deals;
      const leads = periodData.leads;
      const conversionRate = leads > 0 ? (deals / leads) * 100 : 0;
      const avgDealSize = deals > 0 ? revenue / deals : 0;

      data.push({
        date: periodInfo.key,
        label: periodInfo.label,
        fullLabel: periodInfo.fullLabel,
        revenue: Math.round(revenue),
        deals,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealSize: Math.round(avgDealSize),
        chartValue: revenue,
        monthNumber: periodInfo.monthNumber,
        year: periodInfo.year,
        weekNumber: periodInfo.weekNumber,
        quarterNumber: periodInfo.quarterNumber
      });
    });

    return data;
  }

  private generatePeriods(period: string, startDate: Date, endDate: Date): any[] {
    const periods: any[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (period) {
      case 'daily':
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0];
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
          const monthName = monthNames[d.getMonth()];
          periods.push({
            key: dateKey,
            label: `${dayName.substring(0, 3)}`,
            fullLabel: `${dayName}, ${monthName} ${d.getDate()}`,
            monthNumber: d.getMonth() + 1,
            year: d.getFullYear()
          });
        }
        break;

      case 'weekly':
        let currentWeek = new Date(startDate);
        while (currentWeek <= endDate) {
          const weekStart = new Date(currentWeek);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const year = weekStart.getFullYear();
          const weekNumber = this.getWeekNumber(weekStart);
          const key = `${year}-W${String(weekNumber).padStart(2, '0')}`;
          
          periods.push({
            key,
            label: `W${weekNumber}`,
            fullLabel: `Week ${weekNumber}, ${year}`,
            weekNumber,
            year
          });
          
          currentWeek.setDate(currentWeek.getDate() + 7);
        }
        break;

      case 'monthly':
        let currentMonth = new Date(startDate);
        currentMonth.setDate(1); // Start of month
        while (currentMonth <= endDate) {
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth() + 1;
          const key = `${year}-${String(month).padStart(2, '0')}`;
          periods.push({
            key,
            label: monthNames[month - 1],
            fullLabel: `${monthNames[month - 1]} ${year}`,
            monthNumber: month,
            year
          });
          // Move to next month
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
        break;

      case 'quarterly':
        let currentQuarter = new Date(startDate);
        currentQuarter.setDate(1); // Start of month
        // Align to quarter start
        const startQuarter = Math.floor(currentQuarter.getMonth() / 3);
        currentQuarter.setMonth(startQuarter * 3);
        while (currentQuarter <= endDate) {
          const year = currentQuarter.getFullYear();
          const quarter = Math.floor(currentQuarter.getMonth() / 3) + 1;
          const key = `${year}-Q${quarter}`;
          periods.push({
            key,
            label: `Q${quarter}`,
            fullLabel: `Q${quarter} ${year}`,
            quarterNumber: quarter,
            year
          });
          // Move to next quarter
          currentQuarter = new Date(currentQuarter.getFullYear(), currentQuarter.getMonth() + 3, 1);
        }
        break;

      case 'yearly':
        for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
          const key = `${year}`;
          periods.push({
            key,
            label: `${year}`,
            fullLabel: `${year}`,
            year
          });
        }
        break;
    }

    return periods;
  }

  private getPeriodKey(date: Date, period: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    switch (period) {
      case 'daily':
        return d.toISOString().split('T')[0];
      case 'weekly':
        const weekNumber = this.getWeekNumber(d);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case 'monthly':
        return `${year}-${String(month).padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        return `${year}-Q${quarter}`;
      case 'yearly':
        return `${year}`;
      default:
        return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private buildSalesMetadata(
    period: string,
    startDate: Date,
    endDate: Date,
    dataLength: number
  ): any {
    const metadata: any = {
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      generatedAt: new Date().toISOString()
    };

    switch (period) {
      case 'daily':
        metadata.totalDays = dataLength;
        break;
      case 'weekly':
        metadata.totalWeeks = dataLength;
        break;
      case 'monthly':
        metadata.totalMonths = dataLength;
        break;
      case 'quarterly':
        metadata.totalQuarters = dataLength;
        break;
      case 'yearly':
        metadata.totalYears = dataLength;
        break;
    }

    return metadata;
  }

  // TOP PERFORMERS
  async getTopPerformers(
    userId: number,
    department: string,
    role: string,
    userType: string | undefined,
    limit: number = 5,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    fromDate?: string,
    toDate?: string,
    unit?: string,
    metric: 'deals' | 'revenue' | 'conversion_rate' | 'leads' = 'deals'
  ) {
    // Check if user is in Sales department
    if (department !== 'Sales' && userType !== 'admin') {
      throw new ForbiddenException('Access denied. Only Sales department users can access top performers.');
    }

    // Validate limit
    if (limit < 1 || limit > 20) {
      throw new BadRequestException('Limit must be between 1 and 20');
    }

    // Get user's sales department info for hierarchical filtering
    const userSalesDept = await this.prisma.salesDepartment.findFirst({
      where: { employeeId: userId },
      include: {
        salesUnit: {
          select: {
            id: true,
            name: true,
            headId: true,
            teams: {
              select: {
                id: true,
                teamLeadId: true
              }
            }
          }
        }
      }
    });

    // Build hierarchical filters to get employees in scope
    const employeeFilters = await this.getTopPerformersEmployeeFilters(role, userId, userSalesDept, unit);

    // Calculate date range
    const dateRange = this.calculateSalesDateRange(period, fromDate, toDate);
    const { startDate, endDate, prevStartDate, prevEndDate } = dateRange;

    // Get all employees in scope
    const employees = await this.getEmployeesInScope(employeeFilters, userSalesDept);

    if (employees.length === 0) {
      return {
        status: 'success',
        department: 'Sales',
        role,
        period,
        metric,
        summary: {
          totalTeamMembers: 0,
          periodStart: startDate.toISOString().split('T')[0],
          periodEnd: endDate.toISOString().split('T')[0],
          averagePerformance: 0
        },
        data: [],
        metadata: {
          generatedAt: new Date().toISOString()
        }
      };
    }

    const employeeIds = employees.map(e => e.id);

    // Get performance data for current period
    const [crackedLeads, allLeads, prevCrackedLeads, prevAllLeads] = await Promise.all([
      // Current period cracked leads
      this.prisma.crackedLead.findMany({
        where: {
          closedBy: { in: employeeIds },
          crackedAt: { gte: startDate, lte: endDate }
        },
        select: {
          id: true,
          amount: true,
          closedBy: true,
          crackedAt: true
        }
      }),
      // Current period all leads
      this.prisma.lead.findMany({
        where: {
          assignedToId: { in: employeeIds },
          createdAt: { gte: startDate, lte: endDate }
        },
        select: {
          id: true,
          assignedToId: true,
          createdAt: true
        }
      }),
      // Previous period cracked leads
      this.prisma.crackedLead.findMany({
        where: {
          closedBy: { in: employeeIds },
          crackedAt: { gte: prevStartDate, lte: prevEndDate }
        },
        select: {
          id: true,
          amount: true,
          closedBy: true
        }
      }),
      // Previous period all leads
      this.prisma.lead.findMany({
        where: {
          assignedToId: { in: employeeIds },
          createdAt: { gte: prevStartDate, lte: prevEndDate }
        },
        select: {
          id: true,
          assignedToId: true
        }
      })
    ]);

    // Calculate performance metrics for each employee
    const performanceData = this.calculateEmployeePerformance(
      employees,
      crackedLeads,
      allLeads,
      prevCrackedLeads,
      prevAllLeads
    );

    // Rank by selected metric
    const rankedData = this.rankEmployeesByMetric(performanceData, metric);

    // Get top N performers
    const topPerformers = rankedData.slice(0, limit);

    // Calculate average performance
    const averagePerformance = rankedData.length > 0
      ? rankedData.reduce((sum, emp) => sum + emp.value, 0) / rankedData.length
      : 0;

    return {
      status: 'success',
      department: 'Sales',
      role,
      period,
      metric,
      summary: {
        totalTeamMembers: employees.length,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        averagePerformance: Math.round(averagePerformance * 100) / 100
      },
      data: topPerformers,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async getTopPerformersEmployeeFilters(
    role: string,
    userId: number,
    userSalesDept: any,
    unitFilter?: string
  ): Promise<any> {
    // Admin and dep_manager can see all employees (unless unit filter is specified)
    if (role === 'dep_manager' || role === 'admin') {
      if (unitFilter) {
        // Find unit by name and return employees in that unit
        const unit = await this.prisma.salesUnit.findFirst({
          where: { name: unitFilter },
          include: {
            salesEmployees: {
              select: { employeeId: true }
            }
          }
        });
        if (unit) {
          return { salesUnitId: unit.id };
        }
      }
      return {}; // No restrictions - all employees
    }

    if (!userSalesDept) {
      return { id: -1 }; // No access
    }

    const { salesUnitId } = userSalesDept;

    switch (role) {
      case 'unit_head':
        return { salesUnitId };

      case 'team_lead':
        // Get team members
        const teamMembers = await this.prisma.employee.findMany({
          where: { teamLeadId: userId },
          select: { id: true }
        });
        const teamMemberIds = teamMembers.map(m => m.id);
        return {
          salesUnitId,
          id: { in: [...teamMemberIds, userId] }
        };

      case 'senior':
      case 'junior':
        return {
          salesUnitId,
          id: userId
        };

      default:
        return { id: -1 }; // No access
    }
  }

  private async getEmployeesInScope(filters: any, userSalesDept: any): Promise<any[]> {
    // Build where clause for employees
    const where: any = {
      status: 'active',
      department: { name: 'Sales' }
    };

    // Apply filters
    if (filters.salesUnitId) {
      where.salesDepartment = {
        some: {
          salesUnitId: filters.salesUnitId
        }
      };
    }

    if (filters.id) {
      if (typeof filters.id === 'object' && filters.id.in) {
        where.id = { in: filters.id.in };
      } else {
        where.id = filters.id;
      }
    }

    if (filters.id === -1) {
      return []; // No access
    }

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    return employees;
  }

  private calculateEmployeePerformance(
    employees: any[],
    crackedLeads: any[],
    allLeads: any[],
    prevCrackedLeads: any[],
    prevAllLeads: any[]
  ): any[] {
    const performanceMap = new Map<number, {
      employeeId: number;
      employeeName: string;
      deals: number;
      revenue: number;
      leads: number;
      conversionRate: number;
      averageDealSize: number;
      prevDeals: number;
      prevRevenue: number;
      prevLeads: number;
      prevConversionRate: number;
      prevAverageDealSize: number;
    }>();

    // Initialize map
    employees.forEach(emp => {
      performanceMap.set(emp.id, {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        deals: 0,
        revenue: 0,
        leads: 0,
        conversionRate: 0,
        averageDealSize: 0,
        prevDeals: 0,
        prevRevenue: 0,
        prevLeads: 0,
        prevConversionRate: 0,
        prevAverageDealSize: 0
      });
    });

    // Aggregate current period data
    crackedLeads.forEach(cl => {
      const perf = performanceMap.get(cl.closedBy);
      if (perf) {
        perf.deals += 1;
        perf.revenue += Number(cl.amount || 0);
      }
    });

    allLeads.forEach(lead => {
      if (!lead.assignedToId) return;
      const perf = performanceMap.get(lead.assignedToId);
      if (perf) {
        perf.leads += 1;
      }
    });

    // Aggregate previous period data
    prevCrackedLeads.forEach(cl => {
      const perf = performanceMap.get(cl.closedBy);
      if (perf) {
        perf.prevDeals += 1;
        perf.prevRevenue += Number(cl.amount || 0);
      }
    });

    prevAllLeads.forEach(lead => {
      if (!lead.assignedToId) return;
      const perf = performanceMap.get(lead.assignedToId);
      if (perf) {
        perf.prevLeads += 1;
      }
    });

    // Calculate derived metrics
    const performanceData: any[] = [];
    performanceMap.forEach(perf => {
      // Current period metrics
      perf.conversionRate = perf.leads > 0 ? (perf.deals / perf.leads) * 100 : 0;
      perf.averageDealSize = perf.deals > 0 ? perf.revenue / perf.deals : 0;

      // Previous period metrics
      perf.prevConversionRate = perf.prevLeads > 0 ? (perf.prevDeals / perf.prevLeads) * 100 : 0;
      perf.prevAverageDealSize = perf.prevDeals > 0 ? perf.prevRevenue / perf.prevDeals : 0;

      performanceData.push(perf);
    });

    return performanceData;
  }

  private rankEmployeesByMetric(
    performanceData: any[],
    metric: 'deals' | 'revenue' | 'conversion_rate' | 'leads'
  ): any[] {
    // Map metric to value
    const getValue = (emp: any) => {
      switch (metric) {
        case 'deals':
          return emp.deals;
        case 'revenue':
          return emp.revenue;
        case 'conversion_rate':
          return emp.conversionRate;
        case 'leads':
          return emp.leads;
        default:
          return emp.deals;
      }
    };

    const getPrevValue = (emp: any) => {
      switch (metric) {
        case 'deals':
          return emp.prevDeals;
        case 'revenue':
          return emp.prevRevenue;
        case 'conversion_rate':
          return emp.prevConversionRate;
        case 'leads':
          return emp.prevLeads;
        default:
          return emp.prevDeals;
      }
    };

    // Sort by primary metric (descending), then by revenue (if not primary), then by name
    const sorted = performanceData.sort((a, b) => {
      const aValue = getValue(a);
      const bValue = getValue(b);

      // Primary sort by metric value
      if (bValue !== aValue) {
        return bValue - aValue;
      }

      // Secondary sort by revenue (if not primary metric)
      if (metric !== 'revenue') {
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
      }

      // Tertiary sort by deals (if not primary metric)
      if (metric !== 'deals') {
        if (b.deals !== a.deals) {
          return b.deals - a.deals;
        }
      }

      // Final sort by name (alphabetically)
      return a.employeeName.localeCompare(b.employeeName);
    });

    // Add rank and format response
    return sorted.map((emp, index) => {
      const value = getValue(emp);
      const prevValue = getPrevValue(emp);
      const change = value - prevValue;
      const changePercent = prevValue > 0 ? (change / prevValue) * 100 : (value > 0 ? 100 : 0);
      const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const;

      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        value: Math.round(value * 100) / 100,
        metric,
        additionalMetrics: {
          revenue: Math.round(emp.revenue),
          leads: emp.leads,
          conversionRate: Math.round(emp.conversionRate * 100) / 100,
          averageDealSize: Math.round(emp.averageDealSize)
        },
        rank: index + 1,
        change: {
          value: Math.round(change * 100) / 100,
          percentage: Math.round(changePercent * 100) / 100,
          trend
        }
      };
    });
  }
}

