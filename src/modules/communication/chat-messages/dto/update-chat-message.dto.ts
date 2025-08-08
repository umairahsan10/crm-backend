import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';

export class UpdateChatMessageDto {
  @IsOptional()
  @IsString({ message: 'Message content must be a string' })
  @MaxLength(1000, { message: 'Message content cannot exceed 1000 characters' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'Message type must be a string' })
  messageType?: string;

  @IsOptional()
  @IsString({ message: 'Attachment URL must be a string' })
  attachmentUrl?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Chat ID must be a number' })
  chatId?: number;
}
