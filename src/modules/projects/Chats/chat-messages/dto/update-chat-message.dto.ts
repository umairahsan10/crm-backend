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
  @IsString({ message: 'Attachment type must be a string' })
  attachmentType?: string;

  @IsOptional()
  @IsString({ message: 'Attachment name must be a string' })
  attachmentName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Attachment size must be a number' })
  attachmentSize?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Chat ID must be a number' })
  chatId?: number;
}
