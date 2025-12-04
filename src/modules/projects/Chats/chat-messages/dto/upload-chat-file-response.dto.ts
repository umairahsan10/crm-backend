import { ApiProperty } from '@nestjs/swagger';

export class UploadChatFileResponseDto {
  @ApiProperty({ description: 'Cloudinary CDN URL for the uploaded file' })
  url: string;

  @ApiProperty({ description: 'Cloudinary public ID' })
  publicId: string;

  @ApiProperty({ description: 'File type: image or document', enum: ['image', 'document'] })
  type: 'image' | 'document';

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;
}

