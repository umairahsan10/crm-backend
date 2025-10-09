import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatMessagesService } from './chat-messages/chat-messages.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: number;
      role: string;
      type: string;
      department?: string;
      permissions?: any;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://crm-frontend-14zu7mefp-nmeinertias-projects.vercel.app',
      'https://crm-frontend-eight-gamma.vercel.app',
    ],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private activeUsers = new Map<number, string[]>(); // userId -> socketIds[]
  private socketToUser = new Map<string, number>(); // socketId -> userId

  constructor(private chatMessagesService: ChatMessagesService) {}

  afterInit(server: Server) {
    this.logger.log('🚀 Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token and validate
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`❌ Connection rejected - No token provided - Socket: ${client.id}`);
        client.disconnect();
        return;
      }

      // The WsJwtGuard will be applied to messages, but for connection we do basic validation
      this.logger.log(`✅ Client attempting to connect - Socket: ${client.id}`);
      
    } catch (error) {
      this.logger.error(`❌ Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketToUser.get(client.id);
    
    if (userId) {
      // Remove socket from active users
      const userSockets = this.activeUsers.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(client.id);
        if (index > -1) {
          userSockets.splice(index, 1);
        }
        
        if (userSockets.length === 0) {
          this.activeUsers.delete(userId);
        }
      }
      
      this.socketToUser.delete(client.id);
      this.logger.log(`❌ User ${userId} disconnected - Socket: ${client.id}`);
      this.logger.log(`👥 Active users: ${this.activeUsers.size}`);
    } else {
      this.logger.log(`❌ Client disconnected - Socket: ${client.id}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('authenticate')
  async handleAuthenticate(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.user?.id;
    
    if (!userId) {
      return { success: false, message: 'Authentication failed' };
    }

    // Store user's socket connection
    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, []);
    }
    
    const userSockets = this.activeUsers.get(userId);
    if (userSockets && !userSockets.includes(client.id)) {
      userSockets.push(client.id);
    }
    
    this.socketToUser.set(client.id, userId);

    this.logger.log(`✅ User ${userId} authenticated - Socket: ${client.id}`);
    this.logger.log(`👥 Active users: ${this.activeUsers.size}`);

    // Auto-join all chats where the user is a participant
    try {
      const userChats = await this.chatMessagesService['prisma'].chatParticipant.findMany({
        where: { employeeId: userId },
        select: { chatId: true },
      });

      const chatIds = userChats.map(chat => chat.chatId);
      
      for (const chatId of chatIds) {
        await client.join(`chat_${chatId}`);
        this.logger.log(`🔄 Auto-joined user ${userId} to chat_${chatId}`);
        
        // Notify other participants that user is now online in this chat
        client.to(`chat_${chatId}`).emit('userOnline', {
          chatId,
          userId,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.log(`✅ User ${userId} auto-joined ${chatIds.length} chats`);

      return { 
        success: true, 
        message: 'Authenticated successfully',
        userId,
        socketId: client.id,
        autoJoinedChats: chatIds,
      };
    } catch (error) {
      this.logger.error(`❌ Error auto-joining chats: ${error.message}`);
      return { 
        success: true, 
        message: 'Authenticated successfully, but failed to auto-join some chats',
        userId,
        socketId: client.id,
      };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = data;
      const userId = client.data.user?.id;

      if (!userId || !chatId) {
        return { success: false, message: 'Invalid request' };
      }

      // Verify user is a participant in this chat
      const participant = await this.chatMessagesService['prisma'].chatParticipant.findFirst({
        where: {
          chatId: chatId,
          employeeId: userId,
        },
      });

      if (!participant) {
        this.logger.warn(`🚫 User ${userId} attempted to join chat ${chatId} without permission`);
        return { success: false, message: 'You are not a participant in this chat' };
      }

      await client.join(`chat_${chatId}`);
      this.logger.log(`📥 User ${userId} joined chat room: chat_${chatId}`);
      
      // Notify other participants that user joined
      client.to(`chat_${chatId}`).emit('userJoined', {
        chatId,
        userId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: `Joined chat ${chatId}` };
    } catch (error) {
      this.logger.error(`❌ Error joining chat: ${error.message}`);
      return { success: false, message: 'Failed to join chat' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { chatId } = data;
      const userId = client.data.user?.id;

      await client.leave(`chat_${chatId}`);
      this.logger.log(`📤 User ${userId} left chat room: chat_${chatId}`);
      
      // Notify other participants that user left
      client.to(`chat_${chatId}`).emit('userLeft', {
        chatId,
        userId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: `Left chat ${chatId}` };
    } catch (error) {
      this.logger.error(`❌ Error leaving chat: ${error.message}`);
      return { success: false, message: 'Failed to leave chat' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: number; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const userId = client.data.user?.id;
      const { chatId, content } = data;

      if (!userId || !chatId || !content) {
        return { success: false, message: 'Invalid message data' };
      }

      this.logger.log(`📨 User ${userId} sending message to chat ${chatId}`);

      // Verify user is in the chat room, if not, join them first
      const rooms = Array.from(client.rooms);
      const chatRoom = `chat_${chatId}`;
      if (!rooms.includes(chatRoom)) {
        this.logger.warn(`⚠️ User ${userId} not in room ${chatRoom}, joining now...`);
        await client.join(chatRoom);
      }

      // Create message in database
      const result = await this.chatMessagesService.createChatMessage(
        { chatId, content },
        userId,
      );

      const messagePayload = {
        message: result.data,
        chatId,
        senderId: userId,
        timestamp: new Date().toISOString(),
      };

      // Emit to all users in the chat room INCLUDING sender
      // Using .to() broadcasts to everyone in the room, including the sender if they're in the room
      this.server.to(chatRoom).emit('newMessage', messagePayload);

      // Also emit directly to sender as backup to ensure they ALWAYS see their message
      client.emit('newMessage', messagePayload);

      this.logger.log(`✅ Message sent to chat_${chatId} - Message ID: ${result.data.id}`);
      
      return { success: true, data: result.data };
    } catch (error) {
      this.logger.error(`❌ Error sending message: ${error.message}`);
      return { success: false, message: error.message || 'Failed to send message' };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: number; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const userId = client.data.user?.id;
      const { chatId, isTyping } = data;

      if (!userId || !chatId) {
        return { success: false };
      }

      // Broadcast typing status to other users in the chat (exclude sender)
      client.to(`chat_${chatId}`).emit('userTyping', {
        chatId,
        userId,
        isTyping,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error handling typing: ${error.message}`);
      return { success: false };
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { chatId: number; messageId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const userId = client.data.user?.id;
      const { chatId, messageId } = data;

      // Broadcast read status to other users in the chat
      client.to(`chat_${chatId}`).emit('messageRead', {
        chatId,
        messageId,
        userId,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error marking as read: ${error.message}`);
      return { success: false };
    }
  }

  // Public method to emit messages from REST API or other services
  emitNewMessage(chatId: number, message: any) {
    this.server.to(`chat_${chatId}`).emit('newMessage', {
      message,
      chatId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted message to chat_${chatId} via REST API`);
  }

  // Public method to emit message updates
  emitMessageUpdate(chatId: number, message: any) {
    this.server.to(`chat_${chatId}`).emit('messageUpdated', {
      message,
      chatId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted message update to chat_${chatId}`);
  }

  // Public method to emit message deletions
  emitMessageDelete(chatId: number, messageId: number) {
    this.server.to(`chat_${chatId}`).emit('messageDeleted', {
      messageId,
      chatId,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted message deletion to chat_${chatId}`);
  }

  // Public method to emit participant added
  emitParticipantAdded(chatId: number, participant: any, participantCount: number) {
    this.server.to(`chat_${chatId}`).emit('participantAdded', {
      chatId,
      participant,
      participantCount,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted participant added to chat_${chatId} - New count: ${participantCount}`);
  }

  // Public method to emit participant removed
  emitParticipantRemoved(chatId: number, participantId: number, participantCount: number) {
    this.server.to(`chat_${chatId}`).emit('participantRemoved', {
      chatId,
      participantId,
      participantCount,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted participant removed from chat_${chatId} - New count: ${participantCount}`);
  }

  // Public method to emit participant count update
  emitParticipantCountUpdate(chatId: number, participantCount: number) {
    this.server.to(`chat_${chatId}`).emit('participantCountUpdated', {
      chatId,
      participantCount,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`📤 Emitted participant count update to chat_${chatId} - Count: ${participantCount}`);
  }

  // Helper method to extract token from socket
  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  // Get active users count
  getActiveUsersCount(): number {
    return this.activeUsers.size;
  }

  // Get user's socket IDs
  getUserSockets(userId: number): string[] {
    return this.activeUsers.get(userId) || [];
  }

  // Check if user is online
  isUserOnline(userId: number): boolean {
    return this.activeUsers.has(userId);
  }
}

