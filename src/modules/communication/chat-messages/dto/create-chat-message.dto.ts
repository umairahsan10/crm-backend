import { IsNotEmpty, IsNumber, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateChatMessageDto {
  @IsNotEmpty({ message: 'Chat ID is required' })
  @IsNumber({}, { message: 'Chat ID must be a number' })
  chatId: number;

  @IsNotEmpty({ message: 'Sender ID is required' })
  @IsNumber({}, { message: 'Sender ID must be a number' })
  senderId: number;

  @IsNotEmpty({ message: 'Message content is required' })
  @IsString({ message: 'Message content must be a string' })
  @MaxLength(1000, { message: 'Message content cannot exceed 1000 characters' })
  content: string;

  @IsOptional()
  @IsString({ message: 'Message type must be a string' })
  messageType?: string;

  @IsOptional()
  @IsString({ message: 'Attachment URL must be a string' })
  attachmentUrl?: string;
}
