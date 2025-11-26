import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatGateway } from '../chat.gateway';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { PrismaService } from '../../../../../prisma/prisma.service';
import './config/cloudinary.config'; // Initialize Cloudinary

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-crm-backend-2024',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService, ChatGateway, WsJwtGuard, PrismaService],
  exports: [ChatMessagesService, ChatGateway],
})
export class ChatMessagesModule {}
