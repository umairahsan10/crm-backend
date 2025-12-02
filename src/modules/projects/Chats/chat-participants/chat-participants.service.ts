import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateChatParticipantDto } from './dto/create-chat-participant.dto';
import { UpdateChatParticipantDto } from './dto/update-chat-participant.dto';

@Injectable()
export class ChatParticipantsService {
  constructor(private prisma: PrismaService) {}

  async getAllChatParticipants(requesterId: number) {
    try {
      console.log('🔧 [SERVICE] getAllChatParticipants - Starting...');
      console.log('👤 [SERVICE] Requester ID:', requesterId);

      // First, get all chats where the requester is a participant
      console.log(
        '🔍 [SERVICE] Step 1: Finding all chats where requester is a participant...',
      );
      const userParticipations = await this.prisma.chatParticipant.findMany({
        where: { employeeId: requesterId },
        select: { chatId: true },
      });

      console.log(
        '📊 [SERVICE] Found',
        userParticipations.length,
        'chat participations for requester',
      );
      const accessibleChatIds = userParticipations.map((p) => p.chatId);
      console.log('💬 [SERVICE] Accessible Chat IDs:', accessibleChatIds);

      if (accessibleChatIds.length === 0) {
        // User is not a participant in any chat
        console.log(
          '⚠️ [SERVICE] Requester is not a participant in any chat - returning empty array',
        );
        return [];
      }

      // Return only participants from chats where the requester is also a participant
      console.log(
        '🔍 [SERVICE] Step 2: Fetching all participants from accessible chats...',
      );
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          chatId: { in: accessibleChatIds },
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(
        '✅ [SERVICE] Successfully fetched',
        participants.length,
        'participants',
      );
      return participants;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Duplicate entry found. Please check your data.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Foreign key constraint failed. Please check if referenced records exist.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to fetch chat participants: ${error.message}`,
      );
    }
  }

  async getChatParticipantById(id: number, requesterId: number) {
    try {
      console.log('🔧 [SERVICE] getChatParticipantById - Starting...');
      console.log('🆔 [SERVICE] Participant ID:', id);
      console.log('👤 [SERVICE] Requester ID:', requesterId);

      console.log('🔍 [SERVICE] Step 1: Fetching participant record...');
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
        console.log('❌ [SERVICE] Participant not found with ID:', id);
        throw new NotFoundException(
          `Chat participant with ID ${id} not found. Please check the ID and try again.`,
        );
      }

      console.log(
        '📊 [SERVICE] Participant found - Employee:',
        participant.employee?.firstName,
        participant.employee?.lastName,
      );
      console.log(
        '💬 [SERVICE] Participant belongs to Chat ID:',
        participant.chatId,
      );

      // Check if requester is a participant in the same chat
      console.log(
        '🔐 [SERVICE] Step 2: Security Check - Verifying requester is in same chat...',
      );
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: participant.chatId,
          employeeId: requesterId,
        },
      });

      if (!requesterParticipant) {
        console.log(
          '🚫 [SERVICE] Access Denied - Requester is NOT a participant in chat',
          participant.chatId,
        );
        throw new ForbiddenException(
          `Access denied. Only chat participants can view participant details.`,
        );
      }

      console.log(
        '✅ [SERVICE] Security Check Passed - Requester is participant in chat',
        participant.chatId,
      );
      console.log('✅ [SERVICE] Returning participant details');
      return participant;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Duplicate entry found. Please check your data.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Foreign key constraint failed. Please check if referenced records exist.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to fetch chat participant with ID ${id}: ${error.message}`,
      );
    }
  }

  async getChatParticipantsByChatId(chatId: number, requesterId: number) {
    try {
      console.log('🔧 [SERVICE] getChatParticipantsByChatId - Starting...');
      console.log('💬 [SERVICE] Chat ID:', chatId);
      console.log('👤 [SERVICE] Requester ID:', requesterId);

      // First check if the chat exists
      console.log('🔍 [SERVICE] Step 1: Checking if chat exists...');
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        console.log('❌ [SERVICE] Chat not found with ID:', chatId);
        throw new NotFoundException(
          `Chat with ID ${chatId} not found. Please check the chat ID and try again.`,
        );
      }

      console.log('✅ [SERVICE] Chat found - Project ID:', chat.projectId);

      // Check if requester is a participant in this chat
      console.log(
        '🔐 [SERVICE] Step 2: Security Check - Verifying requester is participant in this chat...',
      );
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: requesterId,
        },
      });

      if (!requesterParticipant) {
        console.log(
          '🚫 [SERVICE] Access Denied - Requester is NOT a participant in chat',
          chatId,
        );
        throw new ForbiddenException(
          `Access denied. Only chat participants can view the participant list.`,
        );
      }

      console.log(
        '✅ [SERVICE] Security Check Passed - Requester is',
        requesterParticipant.memberType,
        'in chat',
        chatId,
      );

      // If requester is a participant, return all participants
      console.log(
        '🔍 [SERVICE] Step 3: Fetching all participants for chat',
        chatId,
      );
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
        console.log('⚠️ [SERVICE] No participants found for chat', chatId);
        throw new NotFoundException(
          `No chat participants found for chat ID ${chatId}. Please check the chat ID and try again.`,
        );
      }

      console.log(
        '✅ [SERVICE] Successfully fetched',
        participants.length,
        'participants',
      );
      console.log(
        '📊 [SERVICE] Participants:',
        participants
          .map(
            (p) =>
              `${p.employee.firstName} ${p.employee.lastName} (${p.memberType})`,
          )
          .join(', '),
      );
      return participants;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Duplicate entry found. Please check your data.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Foreign key constraint failed. Please check if referenced records exist.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to fetch chat participants for chat ID ${chatId}: ${error.message}`,
      );
    }
  }

  async createChatParticipant(
    createChatParticipantDto: CreateChatParticipantDto,
    requesterId: number,
  ) {
    try {
      console.log('🔧 [SERVICE] createChatParticipant - Starting...');
      console.log('📥 [SERVICE] Request Data:', createChatParticipantDto);
      console.log('👤 [SERVICE] Requester ID:', requesterId);

      // Validate foreign key references
      console.log('🔍 [SERVICE] Step 1: Validating chat exists...');
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: createChatParticipantDto.chatId },
      });
      if (!chat) {
        console.log(
          '❌ [SERVICE] Chat not found:',
          createChatParticipantDto.chatId,
        );
        throw new BadRequestException(
          `Chat with ID ${createChatParticipantDto.chatId} not found. Please provide a valid chat ID.`,
        );
      }
      console.log('✅ [SERVICE] Chat exists - Project ID:', chat.projectId);

      console.log('🔍 [SERVICE] Step 2: Validating employee exists...');
      const employee = await this.prisma.employee.findUnique({
        where: { id: createChatParticipantDto.employeeId },
      });
      if (!employee) {
        console.log(
          '❌ [SERVICE] Employee not found:',
          createChatParticipantDto.employeeId,
        );
        throw new BadRequestException(
          `Employee with ID ${createChatParticipantDto.employeeId} not found. Please provide a valid employee ID.`,
        );
      }
      console.log(
        '✅ [SERVICE] Employee exists:',
        employee.firstName,
        employee.lastName,
      );

      // Check if requester is an owner of this chat
      console.log(
        '🔐 [SERVICE] Step 3: Security Check - Verifying requester is an owner...',
      );
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: createChatParticipantDto.chatId,
          employeeId: requesterId,
          memberType: 'owner',
        },
      });

      if (!requesterParticipant) {
        console.log(
          '🚫 [SERVICE] Access Denied - Requester is NOT an owner of chat',
          createChatParticipantDto.chatId,
        );
        throw new BadRequestException(
          `Only chat owners can add participants. You are not an owner of this chat.`,
        );
      }
      console.log('✅ [SERVICE] Security Check Passed - Requester is an owner');

      // Check if participant already exists in this chat
      console.log('🔍 [SERVICE] Step 4: Checking for duplicate participant...');
      const existingParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: createChatParticipantDto.chatId,
          employeeId: createChatParticipantDto.employeeId,
        },
      });

      if (existingParticipant) {
        console.log('⚠️ [SERVICE] Participant already exists in chat');
        throw new BadRequestException(
          `Employee with ID ${createChatParticipantDto.employeeId} is already a participant in chat ID ${createChatParticipantDto.chatId}.`,
        );
      }
      console.log('✅ [SERVICE] No duplicate found - proceeding with creation');

      // Only owners can add participants - participants cannot add other participants
      if (createChatParticipantDto.memberType === 'owner') {
        console.log('⚠️ [SERVICE] Cannot manually create owners');
        throw new BadRequestException(
          `Only system can assign owners. You can only add participants.`,
        );
      }

      // Create the chat participant
      console.log('🔧 [SERVICE] Step 5: Creating chat participant...');
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

      console.log(
        '✅ [SERVICE] Participant created with ID:',
        newParticipant.id,
      );

      // Update the participants count in project_chats table
      console.log('🔧 [SERVICE] Step 6: Updating participant count in chat...');
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId: createChatParticipantDto.chatId },
      });

      await this.prisma.projectChat.update({
        where: { id: createChatParticipantDto.chatId },
        data: { participants: participantCount },
      });

      console.log(
        '✅ [SERVICE] Updated participant count to:',
        participantCount,
      );
      console.log(
        '✅ [SERVICE] Successfully created participant - Returning data',
      );
      return newParticipant;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A chat participant with these details already exists. Please check your data.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Foreign key constraint failed. Please check if all referenced records exist.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to create chat participant: ${error.message}`,
      );
    }
  }

  async updateChatParticipant(
    id: number,
    updateChatParticipantDto: UpdateChatParticipantDto,
  ) {
    try {
      // Check if chat participant exists
      const existingParticipant = await this.prisma.chatParticipant.findUnique({
        where: { id },
      });

      if (!existingParticipant) {
        throw new NotFoundException(
          `Chat participant with ID ${id} not found. Please check the ID and try again.`,
        );
      }

      // Validate foreign key references if provided
      if (updateChatParticipantDto.chatId) {
        const chat = await this.prisma.projectChat.findUnique({
          where: { id: updateChatParticipantDto.chatId },
        });
        if (!chat) {
          throw new BadRequestException(
            `Chat with ID ${updateChatParticipantDto.chatId} not found. Please provide a valid chat ID.`,
          );
        }
      }

      if (updateChatParticipantDto.employeeId) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: updateChatParticipantDto.employeeId },
        });
        if (!employee) {
          throw new BadRequestException(
            `Employee with ID ${updateChatParticipantDto.employeeId} not found. Please provide a valid employee ID.`,
          );
        }
      }

      // Check for duplicate participant if changing chat or employee
      if (
        updateChatParticipantDto.chatId ||
        updateChatParticipantDto.employeeId
      ) {
        const newChatId =
          updateChatParticipantDto.chatId || existingParticipant.chatId;
        const newEmployeeId =
          updateChatParticipantDto.employeeId || existingParticipant.employeeId;

        const duplicateParticipant =
          await this.prisma.chatParticipant.findFirst({
            where: {
              chatId: newChatId,
              employeeId: newEmployeeId,
              id: { not: id }, // Exclude current participant
            },
          });

        if (duplicateParticipant) {
          throw new BadRequestException(
            `Employee with ID ${newEmployeeId} is already a participant in chat ID ${newChatId}.`,
          );
        }
      }

      // Multiple owners are now allowed - removed single owner restriction

      // Store the old chat ID for count updates
      const oldChatId = existingParticipant.chatId;
      const newChatId =
        updateChatParticipantDto.chatId || existingParticipant.chatId;

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
        const oldChatParticipantCount = await this.prisma.chatParticipant.count(
          {
            where: { chatId: oldChatId },
          },
        );

        await this.prisma.projectChat.update({
          where: { id: oldChatId },
          data: { participants: oldChatParticipantCount },
        });

        // Update count for the new chat (increased by 1)
        const newChatParticipantCount = await this.prisma.chatParticipant.count(
          {
            where: { chatId: newChatId },
          },
        );

        await this.prisma.projectChat.update({
          where: { id: newChatId },
          data: { participants: newChatParticipantCount },
        });
      }

      return updatedParticipant;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A chat participant with these details already exists. Please check your data.',
        );
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Foreign key constraint failed. Please check if all referenced records exist.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to update chat participant with ID ${id}: ${error.message}`,
      );
    }
  }

  async deleteChatParticipant(id: number, requesterId: number) {
    try {
      console.log('🔧 [SERVICE] deleteChatParticipant - Starting...');
      console.log('🆔 [SERVICE] Participant ID to delete:', id);
      console.log('👤 [SERVICE] Requester ID:', requesterId);

      // Check if chat participant exists
      console.log('🔍 [SERVICE] Step 1: Checking if participant exists...');
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
        console.log('❌ [SERVICE] Participant not found with ID:', id);
        throw new NotFoundException(
          `Chat participant with ID ${id} not found. Please check the ID and try again.`,
        );
      }

      console.log(
        '📊 [SERVICE] Participant found:',
        existingParticipant.employee.firstName,
        existingParticipant.employee.lastName,
      );
      console.log('📊 [SERVICE] Member Type:', existingParticipant.memberType);
      console.log('💬 [SERVICE] Chat ID:', existingParticipant.chatId);

      // Check if requester is an owner of this chat
      console.log(
        '🔐 [SERVICE] Step 2: Security Check - Verifying requester is an owner...',
      );
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingParticipant.chatId,
          employeeId: requesterId,
          memberType: 'owner',
        },
      });

      if (!requesterParticipant) {
        console.log(
          '🚫 [SERVICE] Access Denied - Requester is NOT an owner of chat',
          existingParticipant.chatId,
        );
        throw new BadRequestException(
          `Only chat owners can remove participants. You are not an owner of this chat.`,
        );
      }
      console.log('✅ [SERVICE] Security Check Passed - Requester is an owner');

      // Prevent removal of owners (HR, Production managers, Unit heads)
      if (existingParticipant.memberType === 'owner') {
        console.log(
          '⚠️ [SERVICE] Cannot remove owners - only participants can be removed',
        );
        throw new BadRequestException(
          `Cannot remove chat owners. Only participants can be removed.`,
        );
      }

      const chatId = existingParticipant.chatId;

      // Delete the chat participant
      console.log('🔧 [SERVICE] Step 3: Deleting participant...');
      await this.prisma.chatParticipant.delete({
        where: { id },
      });
      console.log('✅ [SERVICE] Participant deleted successfully');

      // Update the participants count in project_chats table
      console.log('🔧 [SERVICE] Step 4: Updating participant count...');
      const participantCount = await this.prisma.chatParticipant.count({
        where: { chatId },
      });

      await this.prisma.projectChat.update({
        where: { id: chatId },
        data: { participants: participantCount },
      });

      console.log(
        '✅ [SERVICE] Updated participant count to:',
        participantCount,
      );
      console.log(
        '✅ [SERVICE] Successfully deleted participant - Returning result',
      );

      return {
        message: `Chat participant with ID ${id} has been deleted successfully`,
        deletedParticipant: existingParticipant,
        updatedParticipantCount: participantCount,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete chat participant due to existing references. Please remove related records first.',
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete chat participant with ID ${id}: ${error.message}`,
      );
    }
  }
}
