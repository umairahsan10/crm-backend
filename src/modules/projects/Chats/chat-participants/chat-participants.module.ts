import { Module } from '@nestjs/common';
import { ChatParticipantsService } from './chat-participants.service';
import { ChatParticipantsController } from './chat-participants.controller';
import { ChatMessagesModule } from '../chat-messages/chat-messages.module';

@Module({
  imports: [ChatMessagesModule],
  controllers: [ChatParticipantsController],
  providers: [ChatParticipantsService],
  exports: [ChatParticipantsService],
})
export class ChatParticipantsModule {}
