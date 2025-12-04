import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Query, Body, HttpCode, HttpStatus, Request, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { UploadChatFileResponseDto } from './dto/upload-chat-file-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ChatGateway } from '../chat.gateway';
import { uploadToCloudinary } from './utils/file-upload.util';

@ApiTags('Chat Messages')
@ApiBearerAuth()
@Controller('chat-messages')
@UseGuards(JwtAuthGuard)
export class ChatMessagesController {
  constructor(
    private readonly chatMessagesService: ChatMessagesService,
    private readonly chatGateway: ChatGateway,
  ) {}

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

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat-files',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB stricter limit
      },
    })
  )
  @ApiOperation({ summary: 'Upload a file for chat message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        chatId: {
          type: 'number',
          description: 'Chat ID where the file will be used',
        },
      },
      required: ['file', 'chatId'],
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully', type: UploadChatFileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file or file validation failed' })
  @ApiResponse({ status: 403, description: 'User does not have access to this chat' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('chatId') chatId: string,
    @Request() req,
  ) {
    console.log('🎯 [CONTROLLER] POST /chat-messages/upload - Uploading file');
    console.log('[DEBUG] File object:', file);
    console.log('📁 [CONTROLLER] File:', file?.originalname, 'Size:', file?.size);
    console.log('💬 [CONTROLLER] Chat ID:', chatId);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!chatId) {
      throw new BadRequestException('Chat ID is required');
    }

    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new BadRequestException('Invalid chat ID');
    }

    // Validate user has access to the chat
    await this.chatMessagesService.validateChatAccess(chatIdNum, req.user.id);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file, chatIdNum);

    // Delete file from disk after successful upload
    if (file?.path) {
      const fs = await import('fs');
      fs.unlink(file.path, err => {
        if (err) {
          console.error('❌ [CONTROLLER] Failed to delete file from disk:', file.path, err);
        } else {
          console.log('🗑️ [CONTROLLER] Deleted file from disk:', file.path);
        }
      });
    }

    console.log('✅ [CONTROLLER] File uploaded successfully to Cloudinary');
    console.log('🔗 [CONTROLLER] File URL:', uploadResult.url);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: uploadResult,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChatMessage(@Body() createChatMessageDto: CreateChatMessageDto, @Request() req) {
    console.log('🎯 [CONTROLLER] POST /chat-messages - Creating new message');
    console.log('📥 [CONTROLLER] Request Body:', createChatMessageDto);
    console.log('👤 [CONTROLLER] Requester ID:', req.user.id);
    console.log('📎 [CONTROLLER] Attachment:', {
      url: createChatMessageDto.attachmentUrl,
      type: createChatMessageDto.attachmentType,
      name: createChatMessageDto.attachmentName,
      size: createChatMessageDto.attachmentSize,
    });
    const result = await this.chatMessagesService.createChatMessage(createChatMessageDto, req.user.id);
    console.log('✅ [CONTROLLER] Successfully created message ID:', result.data.id);
    // Emit socket event for real-time update
    this.chatGateway.emitNewMessage(createChatMessageDto.chatId, result.data);
    console.log('📡 [CONTROLLER] Emitted socket event for new message');
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
    
    // Emit socket event for real-time update
    this.chatGateway.emitMessageUpdate(result.data.chatId, result.data);
    console.log('📡 [CONTROLLER] Emitted socket event for message update');
    
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
    
    // Get message details before deletion to get chatId
    const message = await this.chatMessagesService.getChatMessageById(id);
    const chatId = message.chatId;
    
    const result = await this.chatMessagesService.deleteChatMessage(id, req.user.id);
    console.log('✅ [CONTROLLER] Successfully deleted message');
    
    // Emit socket event for real-time update
    this.chatGateway.emitMessageDelete(chatId, id);
    console.log('📡 [CONTROLLER] Emitted socket event for message deletion');
    
    return result;
  }
}
