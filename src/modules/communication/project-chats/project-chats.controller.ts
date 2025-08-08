import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body } from '@nestjs/common';
import { ProjectChatsService } from './project-chats.service';
import { CreateProjectChatDto } from './dto/create-project-chat.dto';
import { UpdateProjectChatDto } from './dto/update-project-chat.dto';

@Controller('communication/project-chats')
export class ProjectChatsController {
  constructor(private readonly projectChatsService: ProjectChatsService) {}

  @Get()
  async getAllProjectChats() {
    return this.projectChatsService.getAllProjectChats();
  }

  @Get(':id')
  async getProjectChatById(@Param('id', ParseIntPipe) id: number) {
    return this.projectChatsService.getProjectChatById(id);
  }

  @Post()
  async createProjectChat(@Body() createProjectChatDto: CreateProjectChatDto) {
    return this.projectChatsService.createProjectChat(createProjectChatDto);
  }

  @Put(':id')
  async updateProjectChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectChatDto: UpdateProjectChatDto,
  ) {
    return this.projectChatsService.updateProjectChat(id, updateProjectChatDto);
  }

  @Delete(':id')
  async deleteProjectChat(@Param('id', ParseIntPipe) id: number) {
    return this.projectChatsService.deleteProjectChat(id);
  }
}
