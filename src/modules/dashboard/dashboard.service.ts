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

    const [total, active, cracked, revenue, commission] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.crackedLead.count({ where: { lead: where } }),
      this.prisma.crackedLead.aggregate({ where: { lead: where }, _sum: { amount: true } }),
      this.prisma.salesDepartment.findFirst({ where: { employeeId: user.id }, select: { commissionAmount: true } })
    ]);

    return {
      department: 'Sales',
      role,
      cards: [
        { id: 1, title: 'Leads', value: total.toString(), subtitle: `Active: ${active}` },
        { id: 2, title: 'Conversion Rate', value: total > 0 ? `${((cracked / total) * 100).toFixed(2)}%` : '0%', subtitle: 'Cracked / Total' },
        { id: 3, title: 'Revenue / Commission', value: `$${this.fmt(Number(revenue._sum.amount || 0))} / $${this.fmt(Number(commission?.commissionAmount || 0))}`, subtitle: 'Total / Your share' },
        { id: 4, title: 'Won Deals', value: cracked.toString(), subtitle: 'Cracked leads' }
      ]
    };
  }

  // HR
  private async getHrCards(user: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignedPending = await this.prisma.hrRequest.count({ where: { assignedTo: user.id, status: 'Pending' } });
    const allPending = await this.prisma.hrRequest.count({ where: { status: 'Pending' } });
    const pending = assignedPending > 0 ? assignedPending : allPending;

    const [employees, attendance, onLeave] = await Promise.all([
      this.prisma.employee.count({ where: { status: 'active' } }),
      this.getAttendanceRate(),
      this.prisma.leaveLog.count({ where: { status: 'Approved', startDate: { lte: today }, endDate: { gte: today } } })
    ]);

    return {
      department: 'HR',
      role: user.role.name,
      cards: [
        { id: 1, title: 'Employees', value: employees.toString(), subtitle: 'Active employees' },
        { id: 2, title: 'Attendance Rate', value: `${attendance}%`, subtitle: 'This month' },
        { id: 3, title: 'Request Pending', value: pending.toString(), subtitle: assignedPending > 0 ? 'Assigned to you' : 'All pending' },
        { id: 4, title: 'On Leave Today', value: onLeave.toString(), subtitle: 'Currently on leave' }
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

    const [totalProjects, card2, card3, card4] = await Promise.all([
      this.prisma.project.count({ where }),
      this.getProductionCard2(user, role),
      this.getProductionCard3(user, role, where),
      this.getProductionCard4(user, role, where)
    ]);

    return {
      department: 'Production',
      role,
      cards: [
        { id: 1, title: 'Total Projects', value: totalProjects.toString(), subtitle: this.getSubtitle(role) },
        card2,
        card3,
        card4
      ]
    };
  }

  private async getProductionCard2(user: any, role: string) {
    if (role === 'dep_manager') {
      const count = await this.prisma.productionUnit.count();
      return { id: 2, title: 'Production Units', value: count.toString(), subtitle: 'Total units' };
    }
    if (role === 'unit_head') {
      const unit = await this.prisma.productionUnit.findFirst({ where: { headId: user.id } });
      const count = await this.prisma.team.count({ where: { productionUnitId: unit?.id } });
      return { id: 2, title: 'Teams', value: count.toString(), subtitle: 'In your unit' };
    }
    if (role === 'team_lead') {
      const team = await this.prisma.team.findFirst({ where: { teamLeadId: user.id } });
      if (!team?.teamLeadId) {
        return { id: 2, title: 'Team Members', value: '0', subtitle: 'In your team' };
      }
      const count = await this.prisma.employee.count({ where: { OR: [{ id: team.teamLeadId }, { teamLeadId: team.teamLeadId }] } });
      return { id: 2, title: 'Team Members', value: count.toString(), subtitle: 'In your team' };
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
    return { id: 2, title: 'Team', value: emp?.teamLead?.teamsAsLead[0]?.name || 'No Team', subtitle: 'Your team' };
  }

  private async getProductionCard3(user: any, role: string, where: any) {
    const activeWhere = { ...where, status: 'in_progress' };
    if (role === 'dep_manager' || role === 'unit_head') {
      const count = await this.prisma.project.count({ where: activeWhere });
      return { id: 3, title: 'Active Projects', value: count.toString(), subtitle: 'In progress' };
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
      subtitle: 'Active project' 
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
      return { 
        id: 4, 
        title: 'Most Completed', 
        value: (prod?.projectsCompleted || 0).toString(), 
        subtitle: prod ? `${prod.employee.firstName} ${prod.employee.lastName}` : 'No data' 
      };
    }
    const project = await this.prisma.project.findFirst({ 
      where: activeWhere, 
      select: { liveProgress: true }, 
      orderBy: { updatedAt: 'desc' } 
    });
    return { 
      id: 4, 
      title: 'Progress', 
      value: project?.liveProgress ? `${project.liveProgress}%` : '0%', 
      subtitle: 'Current project' 
    };
  }

  // ACCOUNTANT
  private async getAccountantCards() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [revenue, expenses, allRevenue, allExpenses] = await Promise.all([
      this.prisma.revenue.aggregate({ where: { receivedOn: { gte: start, lte: end } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { paidOn: { gte: start, lte: end } }, _sum: { amount: true } }),
      this.prisma.revenue.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } })
    ]);

    const rev = Number(revenue._sum.amount || 0);
    const exp = Number(expenses._sum.amount || 0);
    const profit = Number(allRevenue._sum.amount || 0) - Number(allExpenses._sum.amount || 0);

    return {
      department: 'Accounts',
      role: 'accountant',
      cards: [
        { id: 1, title: 'Profit', value: this.fmtCurrency(profit), subtitle: 'All time' },
        { id: 2, title: 'Expense', value: this.fmtCurrency(exp), subtitle: 'This month' },
        { id: 3, title: 'Cash Flow', value: this.fmtCurrency(rev - exp), subtitle: 'This month' },
        { id: 4, title: 'Revenue', value: this.fmtCurrency(rev), subtitle: 'This month' }
      ]
    };
  }

  // HELPERS
  private async getAttendanceRate() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

