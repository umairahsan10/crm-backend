import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { ProjectChatsModule } from './project-chats/project-chats.module';
import { ChatParticipantsModule } from './chat-participants/chat-participants.module';
import { ChatMessagesModule } from './chat-messages/chat-messages.module';
import { EmployeeModule } from './employee/employee.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ReminderModule } from './reminder/reminder.module';
import { MeetingModule } from './meeting/meeting.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [ProjectChatsModule, ChatParticipantsModule, ChatMessagesModule, EmployeeModule, ComplaintsModule, ReminderModule, MeetingModule, NotificationsModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
})
export class CommunicationModule {}
