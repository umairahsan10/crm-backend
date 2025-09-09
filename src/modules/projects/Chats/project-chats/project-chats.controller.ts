import { Controller, Get, Post, Delete, Param, ParseIntPipe, Body, UseGuards, Query } from '@nestjs/common';
import { ProjectChatsService } from './project-chats.service';
import { CreateProjectChatDto } from './dto/create-project-chat.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('project-chats')
@UseGuards(JwtAuthGuard)
export class ProjectChatsController {
  constructor(private readonly projectChatsService: ProjectChatsService) {}

  @Get()
  async getAllProjectChats(
    @Query('projectId') projectId?: string,
    @Query('participants') participants?: string,
    @Query('transferredFrom') transferredFrom?: string,
    @Query('transferredTo') transferredTo?: string
  ) {
    const filters = {
      projectId: projectId ? parseInt(projectId, 10) : undefined,
      participants: participants ? parseInt(participants, 10) : undefined,
      transferredFrom: transferredFrom ? parseInt(transferredFrom, 10) : undefined,
      transferredTo: transferredTo ? parseInt(transferredTo, 10) : undefined
    };
    return this.projectChatsService.getAllProjectChats(filters);
  }

  @Get(':id')
  async getProjectChatById(@Param('id', ParseIntPipe) id: number) {
    return this.projectChatsService.getProjectChatById(id);
  }

  @Get('project/:projectId')
  async getProjectChatByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectChatsService.getProjectChatByProjectId(projectId);
  }

  @Post()
  async createProjectChat(@Body() createProjectChatDto: CreateProjectChatDto) {
    return this.projectChatsService.createProjectChat(createProjectChatDto);
  }

  @Delete(':id')
  async deleteProjectChat(@Param('id', ParseIntPipe) id: number) {
    return this.projectChatsService.deleteProjectChat(id);
  }
}
