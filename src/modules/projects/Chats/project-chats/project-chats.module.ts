import { Module } from '@nestjs/common';
import { ProjectChatsService } from './project-chats.service';
import { ProjectChatsController } from './project-chats.controller';

@Module({
  controllers: [ProjectChatsController],
  providers: [ProjectChatsService],
  exports: [ProjectChatsService],
})
export class ProjectChatsModule {}
