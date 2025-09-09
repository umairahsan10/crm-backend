import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

@Injectable()
export class ChatMessagesService {
  constructor(private prisma: PrismaService) {}

  async getAllChatMessages() {
    try {
      return await this.prisma.chatMessage.findMany({
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
          sender: {
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
      throw new InternalServerErrorException(`Failed to fetch chat messages: ${error.message}`);
    }
  }

  async getChatMessageById(id: number) {
    try {
      const message = await this.prisma.chatMessage.findUnique({
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
            },
          },
          sender: {
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

      if (!message) {
        throw new NotFoundException(`Chat message with ID ${id} not found. Please check the ID and try again.`);
      }

      return message;
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
      throw new InternalServerErrorException(`Failed to fetch chat message with ID ${id}: ${error.message}`);
    }
  }

  async getChatMessagesByChatId(chatId: number, requesterId: number, limit?: number, offset?: number) {
    try {
      // Validate if chat exists
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found. Please check the chat ID and try again.`);
      }

      // Check if requester is a participant in this chat
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: requesterId,
        },
      });

      if (!requesterParticipant) {
        throw new ForbiddenException(`Only chat participants can access messages. You are not a participant in this chat.`);
      }

      const messages = await this.prisma.chatMessage.findMany({
        where: { chatId },
        include: {
          sender: {
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
          createdAt: 'desc', // Latest messages first
        },
        take: limit || 50, // Default limit of 50 messages
        skip: offset || 0, // Default offset of 0
      });

      if (messages.length === 0) {
        throw new NotFoundException(`No chat messages found for chat ID ${chatId}. Please check the chat ID and try again.`);
      }

      // Get total count for pagination info
      const totalCount = await this.prisma.chatMessage.count({
        where: { chatId },
      });

      return {
        messages,
        pagination: {
          total: totalCount,
          limit: limit || 50,
          offset: offset || 0,
          hasMore: (offset || 0) + messages.length < totalCount,
        },
        chat: {
          id: chat.id,
          projectId: chat.projectId,
          participants: chat.participants,
        },
      };
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
      throw new InternalServerErrorException(`Failed to fetch chat messages for chat ID ${chatId}: ${error.message}`);
    }
  }

  async getLatestMessageByChatId(chatId: number) {
    try {
      // Validate if chat exists
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found. Please check the chat ID and try again.`);
      }

      const latestMessage = await this.prisma.chatMessage.findFirst({
        where: { chatId },
        include: {
          sender: {
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

      if (!latestMessage) {
        throw new NotFoundException(`No chat messages found for chat ID ${chatId}. Please check the chat ID and try again.`);
      }

      return latestMessage;
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
      throw new InternalServerErrorException(`Failed to fetch latest chat message for chat ID ${chatId}: ${error.message}`);
    }
  }

  async createChatMessage(createChatMessageDto: CreateChatMessageDto, senderId: number) {
    try {
      const { chatId, content, messageType, attachmentUrl } = createChatMessageDto;

      // Validate if chat exists
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
        include: {
          project: true,
        },
      });

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found. Please check the chat ID and try again.`);
      }

      // Validate if sender exists
      const sender = await this.prisma.employee.findUnique({
        where: { id: senderId },
      });

      if (!sender) {
        throw new NotFoundException(`Employee with ID ${senderId} not found. Please check the sender ID and try again.`);
      }

      // Check if sender is a participant in the chat
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: senderId,
        },
      });

      if (!participant) {
        throw new ForbiddenException(`Employee with ID ${senderId} is not a participant in chat ${chatId}. Only chat participants can send messages.`);
      }

      // Create the message
      const createdMessage = await this.prisma.chatMessage.create({
        data: {
          chatId,
          senderId,
          message: content,
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
          sender: {
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

      return {
        message: 'Chat message created successfully',
        data: createdMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to create chat message: ${error.message}`);
    }
  }

  async updateChatMessage(id: number, updateChatMessageDto: UpdateChatMessageDto, senderId: number) {
    try {
      // Validate if message exists
      const existingMessage = await this.prisma.chatMessage.findUnique({
        where: { id },
        include: {
          chat: {
            include: {
              chatParticipants: true,
            },
          },
        },
      });

      if (!existingMessage) {
        throw new NotFoundException(`Chat message with ID ${id} not found. Please check the ID and try again.`);
      }

      // Check if sender is the original message sender
      const isOriginalSender = existingMessage.senderId === senderId;
      
      // Get sender's participant info
      const senderParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingMessage.chatId,
          employeeId: senderId,
        },
      });

      if (!senderParticipant) {
        throw new ForbiddenException(`Employee with ID ${senderId} is not a participant in this chat.`);
      }

      // Time-based restrictions
      const now = new Date();
      const messageCreatedAt = existingMessage.createdAt;
      const timeDifference = now.getTime() - messageCreatedAt.getTime();
      const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes in milliseconds

      // Only original sender can edit their own messages within 2 minutes
      if (!isOriginalSender) {
        throw new ForbiddenException(`Only the original sender can edit their own messages.`);
      }

      if (timeDifference > twoMinutesInMs) {
        throw new ForbiddenException(`You can only edit messages within 2 minutes of sending.`);
      }

      // If chatId is being updated, validate the new chat and participant status
      if (updateChatMessageDto.chatId && updateChatMessageDto.chatId !== existingMessage.chatId) {
        // Validate if new chat exists
        const newChat = await this.prisma.projectChat.findUnique({
          where: { id: updateChatMessageDto.chatId },
        });

        if (!newChat) {
          throw new NotFoundException(`Chat with ID ${updateChatMessageDto.chatId} not found. Please check the chat ID and try again.`);
        }

        // Check if sender is a participant in the new chat
        const newChatParticipant = await this.prisma.chatParticipant.findFirst({
          where: {
            chatId: updateChatMessageDto.chatId,
            employeeId: senderId,
          },
        });

        if (!newChatParticipant) {
          throw new ForbiddenException(`Employee with ID ${senderId} is not a participant in chat ${updateChatMessageDto.chatId}. Cannot move message to this chat.`);
        }
      }

      // Update the message
      const updatedMessage = await this.prisma.chatMessage.update({
        where: { id },
        data: {
          message: updateChatMessageDto.content,
          chatId: updateChatMessageDto.chatId,
          updatedAt: new Date(),
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
          sender: {
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

      return {
        message: 'Chat message updated successfully',
        data: updatedMessage,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to update chat message with ID ${id}: ${error.message}`);
    }
  }

  async deleteChatMessage(id: number, senderId: number) {
    try {
      // Validate if message exists
      const existingMessage = await this.prisma.chatMessage.findUnique({
        where: { id },
        include: {
          chat: {
            include: {
              chatParticipants: true,
            },
          },
        },
      });

      if (!existingMessage) {
        throw new NotFoundException(`Chat message with ID ${id} not found. Please check the ID and try again.`);
      }

      // Check if sender is the original message sender or a chat owner
      const isOriginalSender = existingMessage.senderId === senderId;
      
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingMessage.chatId,
          employeeId: senderId,
        },
      });

      const isOwner = participant?.memberType === 'owner';

      if (!isOriginalSender && !isOwner) {
        throw new ForbiddenException(`Employee with ID ${senderId} is not authorized to delete this message. Only the original sender or chat owners can delete messages.`);
      }

      // Time-based restrictions for participants
      if (isOriginalSender && !isOwner) {
        const now = new Date();
        const messageCreatedAt = existingMessage.createdAt;
        const timeDifference = now.getTime() - messageCreatedAt.getTime();
        const sixtyMinutesInMs = 60 * 60 * 1000; // 60 minutes in milliseconds

        if (timeDifference > sixtyMinutesInMs) {
          throw new ForbiddenException(`You can only delete your own messages within 60 minutes of sending.`);
        }
      }

      // If owner is deleting someone else's message, update the message content instead of deleting
      if (isOwner && !isOriginalSender) {
        const owner = await this.prisma.employee.findUnique({
          where: { id: senderId },
          select: { firstName: true, lastName: true }
        });

        const ownerName = `${owner?.firstName} ${owner?.lastName}`;
        
        await this.prisma.chatMessage.update({
          where: { id },
          data: {
            message: `Owner: ${ownerName} deleted the message`,
            updatedAt: new Date(),
          },
        });

        return {
          message: 'Message marked as deleted by owner',
          data: { id },
        };
      }

      // Delete the message (for original sender within time limit)
      await this.prisma.chatMessage.delete({
        where: { id },
      });

      return {
        message: 'Chat message deleted successfully',
        data: { id },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry found. Please check your data.');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed. Please check if referenced records exist.');
      }
      throw new InternalServerErrorException(`Failed to delete chat message with ID ${id}: ${error.message}`);
    }
  }
}
