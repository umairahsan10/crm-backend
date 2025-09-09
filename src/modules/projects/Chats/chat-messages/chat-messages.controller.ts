import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Query, Body, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('chat-messages')
@UseGuards(JwtAuthGuard)
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Get()
  async getAllChatMessages() {
    return this.chatMessagesService.getAllChatMessages();
  }

  @Get(':id')
  async getChatMessageById(@Param('id', ParseIntPipe) id: number) {
    return this.chatMessagesService.getChatMessageById(id);
  }

  @Get('chat/:chatId')
  async getChatMessagesByChatId(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return this.chatMessagesService.getChatMessagesByChatId(chatId, req.user.id, limitNum, offsetNum);
  }

  @Get('chat/:chatId/latest')
  async getLatestMessageByChatId(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatMessagesService.getLatestMessageByChatId(chatId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChatMessage(@Body() createChatMessageDto: CreateChatMessageDto, @Request() req) {
    return this.chatMessagesService.createChatMessage(createChatMessageDto, req.user.id);
  }

  @Put(':id')
  async updateChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatMessageDto: UpdateChatMessageDto,
    @Request() req
  ) {
    return this.chatMessagesService.updateChatMessage(id, updateChatMessageDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    return this.chatMessagesService.deleteChatMessage(id, req.user.id);
  }
}
