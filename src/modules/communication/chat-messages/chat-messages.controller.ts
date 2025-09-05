import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

@Controller('communication/chat-messages')
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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return this.chatMessagesService.getChatMessagesByChatId(chatId, limitNum, offsetNum);
  }

  @Get('chat/:chatId/latest')
  async getLatestMessageByChatId(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatMessagesService.getLatestMessageByChatId(chatId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChatMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatMessagesService.createChatMessage(createChatMessageDto);
  }

  @Put(':id')
  async updateChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatMessageDto: UpdateChatMessageDto,
    @Query('senderId') senderId: string,
  ) {
    const senderIdNum = parseInt(senderId, 10);
    
    if (!senderIdNum) {
      throw new Error('Sender ID is required for updating messages');
    }
    
    return this.chatMessagesService.updateChatMessage(id, updateChatMessageDto, senderIdNum);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Query('senderId') senderId: string,
  ) {
    const senderIdNum = parseInt(senderId, 10);
    
    if (!senderIdNum) {
      throw new Error('Sender ID is required for deleting messages');
    }
    
    return this.chatMessagesService.deleteChatMessage(id, senderIdNum);
  }
}
