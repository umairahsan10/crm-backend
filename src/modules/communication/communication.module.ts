import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { ProjectChatsModule } from '../projects/Chats/project-chats/project-chats.module';
import { ChatParticipantsModule } from '../projects/Chats/chat-participants/chat-participants.module';
import { ChatMessagesModule } from '../projects/Chats/chat-messages/chat-messages.module';
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
