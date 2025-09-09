import { Module } from '@nestjs/common';
import { ChatParticipantsService } from './chat-participants.service';
import { ChatParticipantsController } from './chat-participants.controller';

@Module({
  controllers: [ChatParticipantsController],
  providers: [ChatParticipantsService],
  exports: [ChatParticipantsService],
})
export class ChatParticipantsModule {}
