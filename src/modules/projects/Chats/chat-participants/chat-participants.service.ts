import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateChatParticipantDto } from './dto/create-chat-participant.dto';
import { UpdateChatParticipantDto } from './dto/update-chat-participant.dto';

@Injectable()
export class ChatParticipantsService {
  constructor(private prisma: PrismaService) {}

  async getAllChatParticipants() {
    try {
      return await this.prisma.chatParticipant.findMany({
        include: {
          chat: {
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
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to fetch chat participants: ${error.message}`);
    }
  }

  async getChatParticipantById(id: number) {
    try {
      const participant = await this.prisma.chatParticipant.findUnique({
        where: { id },
        include: {
          chat: {
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
                take: 5, // Get last 5 messages
              },
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!participant) {
        throw new NotFoundException(`Chat participant with ID ${id} not found. Please check the ID and try again.`);
      }

      return participant;
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
      throw new InternalServerErrorException(`Failed to fetch chat participant with ID ${id}: ${error.message}`);
    }
  }

  async getChatParticipantsByChatId(chatId: number) {
    try {
      const participants = await this.prisma.chatParticipant.findMany({
        where: { chatId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { memberType: 'asc' }, // Owner first, then participants
          { createdAt: 'asc' },
        ],
      });

      if (participants.length === 0) {
        throw new NotFoundException(`No chat participants found for chat ID ${chatId}. Please check the chat ID and try again.`);
      }

      return participants;
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
      throw new InternalServerErrorException(`Failed to fetch chat participants for chat ID ${chatId}: ${error.message}`);
    }
  }

  async createChatParticipant(createChatParticipantDto: CreateChatParticipantDto, requesterId: number) {
    try {
      // Validate foreign key references
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: createChatParticipantDto.chatId },
      });
      if (!chat) {
        throw new BadRequestException(`Chat with ID ${createChatParticipantDto.chatId} not found. Please provide a valid chat ID.`);
      }

      const employee = await this.prisma.employee.findUnique({
        where: { id: createChatParticipantDto.employeeId },
      });
      if (!employee) {
        throw new BadRequestException(`Employee with ID ${createChatParticipantDto.employeeId} not found. Please provide a valid employee ID.`);
      }

      // Check if requester is an owner of this chat
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: createChatParticipantDto.chatId,
          employeeId: requesterId,
          memberType: 'owner'
        },
      });

      if (!requesterParticipant) {
        throw new BadRequestException(`Only chat owners can add participants. You are not an owner of this chat.`);
      }

      // Check if participant already exists in this chat
      const existingParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: createChatParticipantDto.chatId,
          employeeId: createChatParticipantDto.employeeId,
        },
      });

      if (existingParticipant) {
        throw new BadRequestException(`Employee with ID ${createChatParticipantDto.employeeId} is already a participant in chat ID ${createChatParticipantDto.chatId}.`);
      }

      // Only owners can add participants - participants cannot add other participants
      if (createChatParticipantDto.memberType === 'owner') {
        throw new BadRequestException(`Only system can assign owners. You can only add participants.`);
      }

      // Create the chat participant
      const newParticipant = await this.prisma.chatParticipant.create({
        data: {
          chatId: createChatParticipantDto.chatId,
          employeeId: createChatParticipantDto.employeeId,
          memberType: 'participant', // Force participant type for manually added members
        },
        include: {
          chat: {
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
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update the participants count in project_chats table
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId: createChatParticipantDto.chatId },
      });

      await this.prisma.projectChat.update({
        where: { id: createChatParticipantDto.chatId },
        data: { participants: participantCount },
      });

      return newParticipant;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('A chat participant with these details already exists. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if all referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to create chat participant: ${error.message}`);
    }
  }

  async updateChatParticipant(id: number, updateChatParticipantDto: UpdateChatParticipantDto) {
    try {
      // Check if chat participant exists
      const existingParticipant = await this.prisma.chatParticipant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        throw new NotFoundException(`Chat participant with ID ${id} not found. Please check the ID and try again.`);
      }

      // Validate foreign key references if provided
      if (updateChatParticipantDto.chatId) {
        const chat = await this.prisma.projectChat.findUnique({
          where: { id: updateChatParticipantDto.chatId },
        });
        if (!chat) {
          throw new BadRequestException(`Chat with ID ${updateChatParticipantDto.chatId} not found. Please provide a valid chat ID.`);
        }
      }

      if (updateChatParticipantDto.employeeId) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: updateChatParticipantDto.employeeId },
        });
        if (!employee) {
          throw new BadRequestException(`Employee with ID ${updateChatParticipantDto.employeeId} not found. Please provide a valid employee ID.`);
        }
      }

      // Check for duplicate participant if changing chat or employee
      if (updateChatParticipantDto.chatId || updateChatParticipantDto.employeeId) {
        const newChatId = updateChatParticipantDto.chatId || existingParticipant.chatId;
        const newEmployeeId = updateChatParticipantDto.employeeId || existingParticipant.employeeId;

        const duplicateParticipant = await this.prisma.chatParticipant.findFirst({
          where: {
            chatId: newChatId,
            employeeId: newEmployeeId,
            id: { not: id }, // Exclude current participant
          },
        });

        if (duplicateParticipant) {
          throw new BadRequestException(`Employee with ID ${newEmployeeId} is already a participant in chat ID ${newChatId}.`);
        }
      }

      // Multiple owners are now allowed - removed single owner restriction

      // Store the old chat ID for count updates
      const oldChatId = existingParticipant.chatId;
      const newChatId = updateChatParticipantDto.chatId || existingParticipant.chatId;

      // Update the chat participant
      const updatedParticipant = await this.prisma.chatParticipant.update({
        where: { id },
        data: {
          chatId: updateChatParticipantDto.chatId,
          employeeId: updateChatParticipantDto.employeeId,
          memberType: updateChatParticipantDto.memberType,
        },
        include: {
          chat: {
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
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update participant counts for both old and new chats if chat was changed
      if (updateChatParticipantDto.chatId && oldChatId !== newChatId) {
        // Update count for the old chat (decreased by 1)
        const oldChatParticipantCount = await this.prisma.chatParticipant.count({
          where: { chatId: oldChatId },
        });

        await this.prisma.projectChat.update({
          where: { id: oldChatId },
          data: { participants: oldChatParticipantCount },
        });

        // Update count for the new chat (increased by 1)
        const newChatParticipantCount = await this.prisma.chatParticipant.count({
          where: { chatId: newChatId },
        });

        await this.prisma.projectChat.update({
          where: { id: newChatId },
          data: { participants: newChatParticipantCount },
        });
      }

      return updatedParticipant;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('A chat participant with these details already exists. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if all referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to update chat participant with ID ${id}: ${error.message}`);
    }
  }

  async deleteChatParticipant(id: number, requesterId: number) {
    try {
      // Check if chat participant exists
      const existingParticipant = await this.prisma.chatParticipant.findUnique({
        where: { id },
        include: {
          chat: {
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
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!existingParticipant) {
        throw new NotFoundException(`Chat participant with ID ${id} not found. Please check the ID and try again.`);
      }

      // Check if requester is an owner of this chat
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingParticipant.chatId,
          employeeId: requesterId,
          memberType: 'owner'
        },
      });

      if (!requesterParticipant) {
        throw new BadRequestException(`Only chat owners can remove participants. You are not an owner of this chat.`);
      }

      // Prevent removal of owners (HR, Production managers, Unit heads)
      if (existingParticipant.memberType === 'owner') {
        throw new BadRequestException(`Cannot remove chat owners. Only participants can be removed.`);
      }

      const chatId = existingParticipant.chatId;

      // Delete the chat participant
      await this.prisma.chatParticipant.delete({
        where: { id },
      });

      // Update the participants count in project_chats table
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId },
      });

      await this.prisma.projectChat.update({
        where: { id: chatId },
        data: { participants: participantCount },
      });

      return { 
        message: `Chat participant with ID ${id} has been deleted successfully`,
        deletedParticipant: existingParticipant,
        updatedParticipantCount: participantCount
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete chat participant due to existing references. Please remove related records first.');
      }
      throw new InternalServerErrorException(`Failed to delete chat participant with ID ${id}: ${error.message}`);
    }
  }
}
