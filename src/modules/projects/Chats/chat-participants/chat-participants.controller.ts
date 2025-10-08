import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, Request, UseGuards } from '@nestjs/common';
import { ChatParticipantsService } from './chat-participants.service';
import { CreateChatParticipantDto } from './dto/create-chat-participant.dto';
import { UpdateChatParticipantDto } from './dto/update-chat-participant.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('chat-participants')
@UseGuards(JwtAuthGuard)
export class ChatParticipantsController {
  constructor(private readonly chatParticipantsService: ChatParticipantsService) {}

  @Get()
  async getAllChatParticipants(@Request() req) {
    console.log('🎯 [CONTROLLER] GET /chat-participants - Getting all chat participants');
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    console.log('📧 [CONTROLLER] Requester Email:', req.user.email);
    const result = await this.chatParticipantsService.getAllChatParticipants(req.user.id);
    console.log('✅ [CONTROLLER] Successfully retrieved', result.length, 'participants');
    return result;
  }

  @Get(':id')
  async getChatParticipantById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    console.log('🎯 [CONTROLLER] GET /chat-participants/:id - Getting participant by ID');
    console.log('🆔 [CONTROLLER] Participant ID:', id);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatParticipantsService.getChatParticipantById(id, req.user.id);
    console.log('✅ [CONTROLLER] Successfully retrieved participant:', result.employee.firstName, result.employee.lastName);
    return result;
  }

  @Get('chat/:chatId')
  async getChatParticipantsByChatId(@Param('chatId', ParseIntPipe) chatId: number, @Request() req) {
    console.log('🎯 [CONTROLLER] GET /chat-participants/chat/:chatId - Getting participants by chat ID');
    console.log('💬 [CONTROLLER] Chat ID:', chatId);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatParticipantsService.getChatParticipantsByChatId(chatId, req.user.id);
    console.log('✅ [CONTROLLER] Successfully retrieved', result.length, 'participants for chat', chatId);
    return result;
  }

  @Post()
  async createChatParticipant(@Body() createChatParticipantDto: CreateChatParticipantDto, @Request() req) {
    console.log('🎯 [CONTROLLER] POST /chat-participants - Creating new participant');
    console.log('📥 [CONTROLLER] Request Body:', createChatParticipantDto);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatParticipantsService.createChatParticipant(createChatParticipantDto, req.user.id);
    console.log('✅ [CONTROLLER] Successfully created participant ID:', result.id);
    return result;
  }

  @Put(':id')
  async updateChatParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatParticipantDto: UpdateChatParticipantDto,
  ) {
    console.log('🎯 [CONTROLLER] PUT /chat-participants/:id - Updating participant');
    console.log('🆔 [CONTROLLER] Participant ID:', id);
    console.log('📥 [CONTROLLER] Update Data:', updateChatParticipantDto);
    const result = await this.chatParticipantsService.updateChatParticipant(id, updateChatParticipantDto);
    console.log('✅ [CONTROLLER] Successfully updated participant ID:', id);
    return result;
  }

  @Delete(':id')
  async deleteChatParticipant(@Param('id', ParseIntPipe) id: number, @Request() req) {
    console.log('🎯 [CONTROLLER] DELETE /chat-participants/:id - Deleting participant');
    console.log('🆔 [CONTROLLER] Participant ID:', id);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    const result = await this.chatParticipantsService.deleteChatParticipant(id, req.user.id);
    console.log('✅ [CONTROLLER] Successfully deleted participant ID:', id);
    return result;
  }
}
