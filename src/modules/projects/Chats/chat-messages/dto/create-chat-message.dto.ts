import { IsNotEmpty, IsNumber, IsString, IsOptional, MaxLength, ValidateIf } from 'class-validator';

export class CreateChatMessageDto {
  @IsNotEmpty({ message: 'Chat ID is required' })
  @IsNumber({}, { message: 'Chat ID must be a number' })
  chatId: number;

  @ValidateIf((o) => !o.attachmentUrl && !o.imageData)
  @IsNotEmpty({ message: 'Either message content, attachment URL, or image data is required' })
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

  /**
   * Base64 image data for pasted screenshots/images
   * Format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
   * If provided, will be automatically uploaded to Cloudinary
   */
  @IsOptional()
  @IsString({ message: 'Image data must be a base64 string' })
  imageData?: string;
}
