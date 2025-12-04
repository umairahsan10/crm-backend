import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatGateway } from '../chat.gateway';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { JwtConfigService } from '../../../../config/jwt.config';
import './config/cloudinary.config'; // Initialize Cloudinary

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [JwtConfigService],
      useFactory: (jwtConfig: JwtConfigService) => ({
        secret: jwtConfig.getSecret(),
        signOptions: { expiresIn: jwtConfig.getExpiresIn() },
      }),
    }),
  ],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService, ChatGateway, WsJwtGuard],
  exports: [ChatMessagesService, ChatGateway],
})
export class ChatMessagesModule {}
