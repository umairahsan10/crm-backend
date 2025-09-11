import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const projectId = parseInt(request.params.id);

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!projectId) {
      throw new ForbiddenException('Project ID is required');
    }

    // Get project with related data
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        unitHead: true,
        team: true,
        salesRep: true
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access based on role and assignment
    const hasAccess = await this.checkProjectAccess(user, project);
    
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this project');
    }

    // Attach project to request for use in controller
    request.project = project;
    return true;
  }

  private async checkProjectAccess(user: any, project: any): Promise<boolean> {
    // Manager (dep_manager) - Access to all projects
    if (user.role === 'dep_manager') {
      return true;
    }

    // Unit Head (unit_head) - Access to assigned projects
    if (user.role === 'unit_head') {
      return project.unitHeadId === user.id;
    }

    // Team Lead (team_lead) and Employee (senior/junior) - Access to team projects
    if (user.role === 'team_lead' || user.role === 'senior' || user.role === 'junior') {
      if (!project.teamId) {
        return false;
      }

      // Check if user is part of the assigned team
      const userTeam = await this.prisma.employee.findUnique({
        where: { id: user.id },
        select: { teamLeadId: true }
      });

      if (!userTeam) {
        return false;
      }

      // For team lead, check if they lead the assigned team
      if (user.role === 'team_lead') {
        return project.team.teamLeadId === user.id;
      }

      // For employee, check if they are in the assigned team
      return userTeam.teamLeadId === project.team.teamLeadId;
    }

    return false;
  }
}
