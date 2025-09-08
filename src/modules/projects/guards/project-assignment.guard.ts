import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ProjectAssignmentGuard implements CanActivate {
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

    // Get project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        unitHead: true,
        team: true
      }
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // Check assignment permissions based on role
    const canAssign = await this.checkAssignmentPermission(user, project);
    
    if (!canAssign) {
      throw new ForbiddenException('Insufficient permissions for project assignment');
    }

    // Attach project to request
    request.project = project;
    return true;
  }

  private async checkAssignmentPermission(user: any, project: any): Promise<boolean> {
    // Manager (Role 1) - Can assign unit heads
    if (user.roleId === 1) {
      return true;
    }

    // Unit Head (Role 2) - Can assign teams to their projects
    if (user.roleId === 2) {
      return project.unitHeadId === user.id;
    }

    return false;
  }
}
