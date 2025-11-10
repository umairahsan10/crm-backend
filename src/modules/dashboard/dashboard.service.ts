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
}

