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
    // Manager (Role 1) - Access to all projects
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Access to assigned projects
    if (user.roleId === 2) {
      return project.unitHeadId === user.id;
    }

    // Team Lead (Role 3) and Employee - Access to team projects
    if (user.roleId === 3 || user.roleId === 4) {
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
      if (user.roleId === 3) {
        return project.team.teamLeadId === user.id;
      }

      // For employee, check if they are in the assigned team
      return userTeam.teamLeadId === project.team.teamLeadId;
    }

    return false;
  }
}
