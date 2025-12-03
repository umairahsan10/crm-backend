import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectChatsService } from './project-chats.service';
import { CreateProjectChatDto } from './dto/create-project-chat.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@ApiTags('Project Chats')
@ApiBearerAuth()
@Controller('project-chats')
@UseGuards(JwtAuthGuard)
export class ProjectChatsController {
  constructor(private readonly projectChatsService: ProjectChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all project chats with optional filters' })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: Number,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'participants',
    required: false,
    type: Number,
    description: 'Filter by participant user ID',
  })
  @ApiQuery({
    name: 'transferredFrom',
    required: false,
    type: Number,
    description: 'Filter by transfer origin user ID (nullable)',
  })
  @ApiQuery({
    name: 'transferredTo',
    required: false,
    type: Number,
    description: 'Filter by transfer destination user ID (nullable)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project chats retrieved successfully',
  })
  async getAllProjectChats(
    @Request() req,
    @Query('projectId') projectId?: string,
    @Query('participants') participants?: string,
    @Query('transferredFrom') transferredFrom?: string,
    @Query('transferredTo') transferredTo?: string,
  ) {
    console.log(
      '🎯 [CONTROLLER] GET /project-chats - Getting all project chats',
    );
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    console.log('📧 [CONTROLLER] Requester Email:', req.user.email);
    const filters = {
      projectId: projectId ? parseInt(projectId, 10) : undefined,
      participants: participants ? parseInt(participants, 10) : undefined,
      transferredFrom: transferredFrom
        ? parseInt(transferredFrom, 10)
        : undefined,
      transferredTo: transferredTo ? parseInt(transferredTo, 10) : undefined,
    };
    console.log('🔍 [CONTROLLER] Filters:', filters);
    const result = await this.projectChatsService.getAllProjectChats(
      req.user.id,
      filters,
    );
    console.log(
      '✅ [CONTROLLER] Successfully retrieved',
      result.length,
      'chats',
    );
    return result;
  }

  @Get(':id')
  async getProjectChatById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    console.log('🎯 [CONTROLLER] GET /project-chats/:id - Getting chat by ID');
    console.log('🆔 [CONTROLLER] Chat ID:', id);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.projectChatsService.getProjectChatById(
      id,
      req.user.id,
    );
    console.log(
      '✅ [CONTROLLER] Successfully retrieved chat for project:',
      result.project?.description,
    );
    return result;
  }

  @Get('project/:projectId')
  async getProjectChatByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
  ) {
    console.log(
      '🎯 [CONTROLLER] GET /project-chats/project/:projectId - Getting chat by project ID',
    );
    console.log('📁 [CONTROLLER] Project ID:', projectId);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.projectChatsService.getProjectChatByProjectId(
      projectId,
      req.user.id,
    );
    console.log('✅ [CONTROLLER] Successfully retrieved chat ID:', result.id);
    return result;
  }

  @Post()
  async createProjectChat(@Body() createProjectChatDto: CreateProjectChatDto) {
    console.log(
      '🎯 [CONTROLLER] POST /project-chats - Creating new project chat',
    );
    console.log('📥 [CONTROLLER] Request Body:', createProjectChatDto);
    const result =
      await this.projectChatsService.createProjectChat(createProjectChatDto);
    console.log('✅ [CONTROLLER] Successfully created chat ID:', result.id);
    return result;
  }

  @Delete(':id')
  async deleteProjectChat(@Param('id', ParseIntPipe) id: number) {
    console.log(
      '🎯 [CONTROLLER] DELETE /project-chats/:id - Deleting project chat',
    );
    console.log('🆔 [CONTROLLER] Chat ID:', id);
    const result = await this.projectChatsService.deleteProjectChat(id);
    console.log('✅ [CONTROLLER] Successfully deleted chat ID:', id);
    return result;
  }

  @Get('debug/my-participations')
  async getMyParticipations(@Request() req) {
    console.log(
      '🎯 [CONTROLLER] GET /project-chats/debug/my-participations - Debug endpoint',
    );
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.projectChatsService.debugUserParticipations(
      req.user.id,
    );
    console.log('✅ [CONTROLLER] Debug info retrieved');
    return result;
  }
}
