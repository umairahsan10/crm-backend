import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { TimeStorageUtil } from '../../../../common/utils/time-storage.util';
import { uploadBase64ImageToCloudinary } from './utils/file-upload.util';

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
      console.log('🔧 [SERVICE] getChatMessagesByChatId - Starting...');
      console.log('💬 [SERVICE] Chat ID:', chatId);
      console.log('👤 [SERVICE] Requester ID:', requesterId);
      console.log('📊 [SERVICE] Pagination - Limit:', limit || 50, 'Offset:', offset || 0);
      
      // Validate if chat exists
      console.log('🔍 [SERVICE] Step 1: Checking if chat exists...');
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
      });

      if (!chat) {
        console.log('❌ [SERVICE] Chat not found with ID:', chatId);
        throw new NotFoundException(`Chat with ID ${chatId} not found. Please check the chat ID and try again.`);
      }

      console.log('✅ [SERVICE] Chat found - Project ID:', chat.projectId);

      // Check if requester is a participant in this chat
      console.log('🔐 [SERVICE] Step 2: Security Check - Verifying requester is participant...');
      const requesterParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: requesterId,
        },
      });

      if (!requesterParticipant) {
        console.log('🚫 [SERVICE] Access Denied - Requester is NOT a participant in chat', chatId);
        throw new ForbiddenException(`Only chat participants can access messages. You are not a participant in this chat.`);
      }

      console.log('✅ [SERVICE] Security Check Passed - Requester is', requesterParticipant.memberType, 'in chat', chatId);

      console.log('🔍 [SERVICE] Step 3: Fetching messages with pagination (oldest first)...');
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
          createdAt: 'asc', // Oldest messages first (reversed order)
        },
        take: limit || 50, // Default limit of 50 messages
        skip: offset || 0, // Default offset of 0
      });

      if (messages.length === 0) {
        console.log('⚠️ [SERVICE] No messages found for chat', chatId);
        throw new NotFoundException(`No chat messages found for chat ID ${chatId}. Please check the chat ID and try again.`);
      }

      console.log('📊 [SERVICE] Found', messages.length, 'messages');

      // Get total count for pagination info
      console.log('🔧 [SERVICE] Step 4: Getting total message count...');
      const totalCount = await this.prisma.chatMessage.count({
        where: { chatId },
      });

      console.log('📊 [SERVICE] Total messages in chat:', totalCount);
      console.log('✅ [SERVICE] Successfully retrieved messages - Returning data');

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

  /**
   * Validates that a user has access to a chat
   */
  async validateChatAccess(chatId: number, userId: number): Promise<void> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        employeeId: userId,
      },
    });

    if (!participant) {
      throw new ForbiddenException(`You do not have access to chat ${chatId}. Only chat participants can upload files.`);
    }
  }

  async createChatMessage(createChatMessageDto: CreateChatMessageDto, senderId: number) {
    try {
      console.log('🔧 [SERVICE] createChatMessage - Starting...');
      console.log('📥 [SERVICE] Message Data:', createChatMessageDto);
      console.log('👤 [SERVICE] Sender ID:', senderId);
      
      const { chatId, content, messageType, attachmentUrl, attachmentType, attachmentName, attachmentSize, imageData } = createChatMessageDto;

      // Handle base64 image data (pasted screenshots)
      let finalAttachmentUrl = attachmentUrl;
      let finalAttachmentType = attachmentType;
      let finalAttachmentName = attachmentName;
      let finalAttachmentSize = attachmentSize;

      if (imageData) {
        console.log('🖼️ [SERVICE] Processing pasted image data...');
        try {
          const uploadResult = await uploadBase64ImageToCloudinary(imageData, chatId);
          finalAttachmentUrl = uploadResult.url;
          finalAttachmentType = uploadResult.type;
          finalAttachmentName = uploadResult.originalName;
          finalAttachmentSize = uploadResult.size;
          console.log('✅ [SERVICE] Image uploaded to Cloudinary:', uploadResult.url);
        } catch (error) {
          console.error('❌ [SERVICE] Failed to upload pasted image:', error);
          throw new BadRequestException(
            `Failed to upload pasted image: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Validate that either content, attachmentUrl, or imageData is provided
      if (!content && !finalAttachmentUrl && !imageData) {
        throw new BadRequestException('Either message content, attachment URL, or image data is required');
      }

      // Validate if chat exists
      console.log('🔍 [SERVICE] Step 1: Validating chat exists...');
      const chat = await this.prisma.projectChat.findUnique({
        where: { id: chatId },
        include: {
          project: true,
        },
      });

      if (!chat) {
        console.log('❌ [SERVICE] Chat not found with ID:', chatId);
        throw new NotFoundException(`Chat with ID ${chatId} not found. Please check the chat ID and try again.`);
      }

      console.log('✅ [SERVICE] Chat exists - Project ID:', chat.projectId);

      // Validate if sender exists
      console.log('🔍 [SERVICE] Step 2: Validating sender exists...');
      const sender = await this.prisma.employee.findUnique({
        where: { id: senderId },
      });

      if (!sender) {
        console.log('❌ [SERVICE] Sender not found with ID:', senderId);
        throw new NotFoundException(`Employee with ID ${senderId} not found. Please check the sender ID and try again.`);
      }

      console.log('✅ [SERVICE] Sender exists:', sender.firstName, sender.lastName);

      // Check if sender is a participant in the chat
      console.log('🔐 [SERVICE] Step 3: Security Check - Verifying sender is participant...');
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: senderId,
        },
      });

      if (!participant) {
        console.log('🚫 [SERVICE] Access Denied - Sender is NOT a participant in chat', chatId);
        throw new ForbiddenException(`Employee with ID ${senderId} is not a participant in chat ${chatId}. Only chat participants can send messages.`);
      }

      console.log('✅ [SERVICE] Security Check Passed - Sender is', participant.memberType, 'in chat', chatId);

      // Create the message
      console.log('🔧 [SERVICE] Step 4: Creating chat message...');
      console.log('💬 [SERVICE] Message content:', content);
      console.log('📎 [SERVICE] Attachment URL:', finalAttachmentUrl);
      console.log('📎 [SERVICE] Attachment Type:', finalAttachmentType);
      console.log('📎 [SERVICE] Attachment Name:', finalAttachmentName);
      console.log('📎 [SERVICE] Attachment Size:', finalAttachmentSize);
      const pktTime = TimeStorageUtil.getCurrentPKTTimeForStorage();
      console.log('🕐 [SERVICE] Message timestamp (PKT):', pktTime.toISOString());
      const createdMessage = await this.prisma.chatMessage.create({
        data: {
          chatId,
          senderId,
          message: content || null,
          attachmentUrl: finalAttachmentUrl || null,
          attachmentType: finalAttachmentType || null,
          attachmentName: finalAttachmentName || null,
          attachmentSize: finalAttachmentSize || null,
          createdAt: pktTime,
          updatedAt: pktTime,
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

      console.log('✅ [SERVICE] Message created successfully with ID:', createdMessage.id);
      console.log('✅ [SERVICE] Returning message data');
      
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
      console.log('🔧 [SERVICE] updateChatMessage - Starting...');
      console.log('🆔 [SERVICE] Message ID:', id);
      console.log('📥 [SERVICE] Update Data:', updateChatMessageDto);
      console.log('👤 [SERVICE] Sender ID:', senderId);
      
      // Validate if message exists
      console.log('🔍 [SERVICE] Step 1: Checking if message exists...');
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
        console.log('❌ [SERVICE] Message not found with ID:', id);
        throw new NotFoundException(`Chat message with ID ${id} not found. Please check the ID and try again.`);
      }

      console.log('📊 [SERVICE] Message found - Original sender:', existingMessage.senderId);
      console.log('📊 [SERVICE] Message content:', existingMessage.message?.substring(0, 50) + '...');
      console.log('💬 [SERVICE] Chat ID:', existingMessage.chatId);

      // Check if sender is the original message sender
      const isOriginalSender = existingMessage.senderId === senderId;
      console.log('🔐 [SERVICE] Step 2: Security Check - Is original sender?', isOriginalSender);
      
      // Get sender's participant info
      const senderParticipant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingMessage.chatId,
          employeeId: senderId,
        },
      });

      if (!senderParticipant) {
        console.log('🚫 [SERVICE] Access Denied - Sender is NOT a participant in chat');
        throw new ForbiddenException(`Employee with ID ${senderId} is not a participant in this chat.`);
      }

      console.log('✅ [SERVICE] Sender is participant in chat');

      // Time-based restrictions
      const now = new Date();
      const messageCreatedAt = existingMessage.createdAt;
      const timeDifference = now.getTime() - messageCreatedAt.getTime();
      const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes in milliseconds
      const minutesElapsed = Math.floor(timeDifference / 60000);

      console.log('⏰ [SERVICE] Step 3: Time Check - Minutes elapsed:', minutesElapsed);

      // Only original sender can edit their own messages within 2 minutes
      if (!isOriginalSender) {
        console.log('🚫 [SERVICE] Access Denied - Not the original sender');
        throw new ForbiddenException(`Only the original sender can edit their own messages.`);
      }

      if (timeDifference > twoMinutesInMs) {
        console.log('🚫 [SERVICE] Time Limit Exceeded - Can only edit within 2 minutes');
        throw new ForbiddenException(`You can only edit messages within 2 minutes of sending.`);
      }

      console.log('✅ [SERVICE] Security and time checks passed');

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
      console.log('🔧 [SERVICE] Step 4: Updating message...');
      const pktTime = TimeStorageUtil.getCurrentPKTTimeForStorage();
      console.log('🕐 [SERVICE] Update timestamp (PKT):', pktTime.toISOString());
      const updatedMessage = await this.prisma.chatMessage.update({
        where: { id },
        data: {
          message: updateChatMessageDto.content,
          chatId: updateChatMessageDto.chatId,
          updatedAt: pktTime,
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

      console.log('✅ [SERVICE] Message updated successfully');
      console.log('✅ [SERVICE] Returning updated message data');
      
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
      console.log('🔧 [SERVICE] deleteChatMessage - Starting...');
      console.log('🆔 [SERVICE] Message ID to delete:', id);
      console.log('👤 [SERVICE] Requester ID:', senderId);
      
      // Validate if message exists
      console.log('🔍 [SERVICE] Step 1: Checking if message exists...');
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
        console.log('❌ [SERVICE] Message not found with ID:', id);
        throw new NotFoundException(`Chat message with ID ${id} not found. Please check the ID and try again.`);
      }

      console.log('📊 [SERVICE] Message found - Original sender:', existingMessage.senderId);
      console.log('💬 [SERVICE] Chat ID:', existingMessage.chatId);

      // Check if sender is the original message sender or a chat owner
      const isOriginalSender = existingMessage.senderId === senderId;
      console.log('🔐 [SERVICE] Step 2: Security Check - Is original sender?', isOriginalSender);
      
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          chatId: existingMessage.chatId,
          employeeId: senderId,
        },
      });

      const isOwner = participant?.memberType === 'owner';
      console.log('👑 [SERVICE] Is chat owner?', isOwner);

      if (!isOriginalSender && !isOwner) {
        console.log('🚫 [SERVICE] Access Denied - Not sender or owner');
        throw new ForbiddenException(`Employee with ID ${senderId} is not authorized to delete this message. Only the original sender or chat owners can delete messages.`);
      }

      console.log('✅ [SERVICE] Security check passed - User authorized to delete');

      // Time-based restrictions for participants
      if (isOriginalSender && !isOwner) {
        const now = new Date();
        const messageCreatedAt = existingMessage.createdAt;
        const timeDifference = now.getTime() - messageCreatedAt.getTime();
        const sixtyMinutesInMs = 60 * 60 * 1000; // 60 minutes in milliseconds
        const minutesElapsed = Math.floor(timeDifference / 60000);

        console.log('⏰ [SERVICE] Step 3: Time Check - Minutes elapsed:', minutesElapsed);

        if (timeDifference > sixtyMinutesInMs) {
          console.log('🚫 [SERVICE] Time Limit Exceeded - Can only delete within 60 minutes');
          throw new ForbiddenException(`You can only delete your own messages within 60 minutes of sending.`);
        }

        console.log('✅ [SERVICE] Within time limit');
      }

      // If owner is deleting someone else's message, update the message content instead of deleting
      if (isOwner && !isOriginalSender) {
        console.log('👑 [SERVICE] Owner deleting another user\'s message - will mark as deleted');
        
        const owner = await this.prisma.employee.findUnique({
          where: { id: senderId },
          select: { firstName: true, lastName: true }
        });

        const ownerName = `${owner?.firstName} ${owner?.lastName}`;
        console.log('👑 [SERVICE] Owner name:', ownerName);
        
        const pktTime = TimeStorageUtil.getCurrentPKTTimeForStorage();
        await this.prisma.chatMessage.update({
          where: { id },
          data: {
            message: `Owner: ${ownerName} deleted the message`,
            updatedAt: pktTime,
          },
        });

        console.log('✅ [SERVICE] Message marked as deleted by owner');
        return {
          message: 'Message marked as deleted by owner',
          data: { id },
        };
      }

      // Delete the message (for original sender within time limit)
      console.log('🔧 [SERVICE] Step 4: Hard deleting message...');
      await this.prisma.chatMessage.delete({
        where: { id },
      });

      console.log('✅ [SERVICE] Message deleted successfully');
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
