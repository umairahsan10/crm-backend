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
    console.log('🎯 [CONTROLLER] GET /chat-messages/chat/:chatId - Getting messages by chat ID');
    console.log('💬 [CONTROLLER] Chat ID:', chatId);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    console.log('📊 [CONTROLLER] Pagination - Limit:', limit || 'default(50)', 'Offset:', offset || '0');
    
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    const result = await this.chatMessagesService.getChatMessagesByChatId(chatId, req.user.id, limitNum, offsetNum);
    console.log('✅ [CONTROLLER] Successfully retrieved', result.messages.length, 'messages');
    return result;
  }

  @Get('chat/:chatId/latest')
  async getLatestMessageByChatId(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatMessagesService.getLatestMessageByChatId(chatId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChatMessage(@Body() createChatMessageDto: CreateChatMessageDto, @Request() req) {
    console.log('🎯 [CONTROLLER] POST /chat-messages - Creating new message');
    console.log('📥 [CONTROLLER] Request Body:', createChatMessageDto);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatMessagesService.createChatMessage(createChatMessageDto, req.user.id);
    console.log('✅ [CONTROLLER] Successfully created message ID:', result.data.id);
    return result;
  }

  @Put(':id')
  async updateChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatMessageDto: UpdateChatMessageDto,
    @Request() req
  ) {
    console.log('🎯 [CONTROLLER] PUT /chat-messages/:id - Updating message');
    console.log('🆔 [CONTROLLER] Message ID:', id);
    console.log('📥 [CONTROLLER] Update Data:', updateChatMessageDto);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatMessagesService.updateChatMessage(id, updateChatMessageDto, req.user.id);
    console.log('✅ [CONTROLLER] Successfully updated message ID:', result.data.id);
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteChatMessage(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    console.log('🎯 [CONTROLLER] DELETE /chat-messages/:id - Deleting message');
    console.log('🆔 [CONTROLLER] Message ID:', id);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatMessagesService.deleteChatMessage(id, req.user.id);
    console.log('✅ [CONTROLLER] Successfully deleted message');
    return result;
  }
}
