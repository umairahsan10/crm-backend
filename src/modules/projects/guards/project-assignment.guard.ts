import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
        team: true,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // Check assignment permissions based on role
    const canAssign = await this.checkAssignmentPermission(user, project);

    if (!canAssign) {
      throw new ForbiddenException(
        'Insufficient permissions for project assignment',
      );
    }

    // Attach project to request
    request.project = project;
    return true;
  }

  private async checkAssignmentPermission(
    user: any,
    project: any,
  ): Promise<boolean> {
    // Manager (dep_manager) - Can assign unit heads
    if (user.role === 'dep_manager') {
      return true;
    }

    // Unit Head (unit_head) - Can assign teams to their projects
    if (user.role === 'unit_head') {
      return project.unitHeadId === user.id;
    }

    return false;
  }
}
