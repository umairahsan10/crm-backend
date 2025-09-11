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
  async getAllChatParticipants() {
    return this.chatParticipantsService.getAllChatParticipants();
  }

  @Get(':id')
  async getChatParticipantById(@Param('id', ParseIntPipe) id: number) {
    return this.chatParticipantsService.getChatParticipantById(id);
  }

  @Get('chat/:chatId')
  async getChatParticipantsByChatId(@Param('chatId', ParseIntPipe) chatId: number) {
    return this.chatParticipantsService.getChatParticipantsByChatId(chatId);
  }

  @Post()
  async createChatParticipant(@Body() createChatParticipantDto: CreateChatParticipantDto, @Request() req) {
    return this.chatParticipantsService.createChatParticipant(createChatParticipantDto, req.user.id);
  }

  @Put(':id')
  async updateChatParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatParticipantDto: UpdateChatParticipantDto,
  ) {
    return this.chatParticipantsService.updateChatParticipant(id, updateChatParticipantDto);
  }

  @Delete(':id')
  async deleteChatParticipant(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.chatParticipantsService.deleteChatParticipant(id, req.user.id);
  }
}
