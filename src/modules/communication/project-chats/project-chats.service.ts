import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateProjectChatDto } from './dto/create-project-chat.dto';
import { UpdateProjectChatDto } from './dto/update-project-chat.dto';

@Injectable()
export class ProjectChatsService {
  constructor(private prisma: PrismaService) {}

  async getAllProjectChats() {
    try {
      return await this.prisma.projectChat.findMany({
        include: {
          project: true,
          transferredFromEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          transferredToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          chatParticipants: {
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
          chatMessages: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get only the latest message
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to fetch project chats: ${error.message}`);
    }
  }

  async getProjectChatById(id: number) {
    try {
      const chat = await this.prisma.projectChat.findUnique({
        where: { id },
        include: {
          project: true,
          transferredFromEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          transferredToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          chatParticipants: {
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
          chatMessages: {
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!chat) {
        throw new NotFoundException(`Project chat with ID ${id} not found. Please check the ID and try again.`);
      }

      return chat;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to fetch project chat with ID ${id}: ${error.message}`);
    }
  }

  async createProjectChat(createProjectChatDto: CreateProjectChatDto) {
    try {
      // Validate foreign key references if provided
      if (createProjectChatDto.projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: createProjectChatDto.projectId },
        });
        if (!project) {
          throw new BadRequestException(`Project with ID ${createProjectChatDto.projectId} not found. Please provide a valid project ID.`);
        }
      }

      if (createProjectChatDto.transferredFrom) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: createProjectChatDto.transferredFrom },
        });
        if (!employee) {
          throw new BadRequestException(`Employee with ID ${createProjectChatDto.transferredFrom} not found. Please provide a valid employee ID.`);
        }
      }

      if (createProjectChatDto.transferredTo) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: createProjectChatDto.transferredTo },
        });
        if (!employee) {
          throw new BadRequestException(`Employee with ID ${createProjectChatDto.transferredTo} not found. Please provide a valid employee ID.`);
        }
      }

      return await this.prisma.projectChat.create({
        data: {
          projectId: createProjectChatDto.projectId,
          participants: createProjectChatDto.participants,
          transferredFrom: createProjectChatDto.transferredFrom,
          transferredTo: createProjectChatDto.transferredTo,
        },
        include: {
          project: true,
          transferredFromEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          transferredToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          chatParticipants: {
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
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('A project chat with these details already exists. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if all referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to create project chat: ${error.message}`);
    }
  }

  async updateProjectChat(id: number, updateProjectChatDto: UpdateProjectChatDto) {
    try {
      // Check if project chat exists
      const existingChat = await this.prisma.projectChat.findUnique({
        where: { id },
      });

      if (!existingChat) {
        throw new NotFoundException(`Project chat with ID ${id} not found. Please check the ID and try again.`);
      }

      // Validate foreign key references if provided
      if (updateProjectChatDto.projectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: updateProjectChatDto.projectId },
        });
        if (!project) {
          throw new BadRequestException(`Project with ID ${updateProjectChatDto.projectId} not found. Please provide a valid project ID.`);
        }
      }

      if (updateProjectChatDto.transferredFrom) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: updateProjectChatDto.transferredFrom },
        });
        if (!employee) {
          throw new BadRequestException(`Employee with ID ${updateProjectChatDto.transferredFrom} not found. Please provide a valid employee ID.`);
        }
      }

      if (updateProjectChatDto.transferredTo) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: updateProjectChatDto.transferredTo },
        });
        if (!employee) {
          throw new BadRequestException(`Employee with ID ${updateProjectChatDto.transferredTo} not found. Please provide a valid employee ID.`);
        }
      }

      return await this.prisma.projectChat.update({
        where: { id },
        data: {
          projectId: updateProjectChatDto.projectId,
          participants: updateProjectChatDto.participants,
          transferredFrom: updateProjectChatDto.transferredFrom,
          transferredTo: updateProjectChatDto.transferredTo,
        },
        include: {
          project: true,
          transferredFromEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          transferredToEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          chatParticipants: {
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
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('A project chat with these details already exists. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if all referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to update project chat with ID ${id}: ${error.message}`);
    }
  }

  async deleteProjectChat(id: number) {
    try {
      // Check if project chat exists
      const existingChat = await this.prisma.projectChat.findUnique({
        where: { id },
      });

      if (!existingChat) {
        throw new NotFoundException(`Project chat with ID ${id} not found. Please check the ID and try again.`);
      }

      // Delete related records first (chat participants and messages)
      await this.prisma.chatParticipant.deleteMany({
        where: { chatId: id },
      });

      await this.prisma.chatMessage.deleteMany({
        where: { chatId: id },
      });

      // Delete the project chat
      await this.prisma.projectChat.delete({
        where: { id },
      });

      return { 
        message: `Project chat with ID ${id} has been deleted successfully`,
        deletedChat: existingChat
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete project chat due to existing references. Please remove related records first.');
      }
      throw new InternalServerErrorException(`Failed to delete project chat with ID ${id}: ${error.message}`);
    }
  }
}
