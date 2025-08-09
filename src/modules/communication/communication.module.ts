import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { ProjectChatsModule } from './project-chats/project-chats.module';
import { ChatParticipantsModule } from './chat-participants/chat-participants.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { EmployeeModule } from './employee/employee.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ReminderModule } from './reminder/reminder.module';

@Module({
  imports: [ProjectChatsModule, ChatParticipantsModule, ChatMessagesModule, EmployeeModule, ComplaintsModule, ReminderModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
})
export class CommunicationModule {}
