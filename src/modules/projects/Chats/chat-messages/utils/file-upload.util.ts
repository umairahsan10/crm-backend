import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import * as path from 'path';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

export interface FileUploadResult {
  url: string;
  publicId: string;
  type: 'image' | 'document';
  originalName: string;
  size: number;
}

/**
 * Validates file type and size
 */
export function validateFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);

  if (!isImage && !isDocument) {
    throw new BadRequestException(
      `File type not allowed. Allowed types: Images (${ALLOWED_IMAGE_TYPES.join(', ')}) or Documents (${ALLOWED_DOCUMENT_TYPES.join(', ')})`
    );
  }
}

/**
 * Determines if file is an image or document
 */
export function getFileType(mimetype: string): 'image' | 'document' {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return 'image';
  }
  return 'document';
}

/**
 * Generates a unique filename with timestamp
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  // Sanitize filename to prevent path traversal
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${timestamp}-${sanitizedName}${ext}`;
}

/**
 * Uploads file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Express.Multer.File,
  chatId: number
): Promise<FileUploadResult> {
  validateFile(file);

  const fileType = getFileType(file.mimetype);
  const fileName = generateFileName(file.originalname);
  const folder = `chat/${chatId}`;

  try {
    // Upload to Cloudinary
    const uploadOptions: UploadApiOptions = {
      folder,
      public_id: `${folder}/${fileName.replace(path.extname(fileName), '')}`, // Include folder in public_id
      resource_type: fileType === 'image' ? 'image' : 'raw', // Use 'raw' for documents
    };

    // Convert buffer to base64 for Cloudinary upload
    const base64File = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64File}`;

    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: fileType,
      originalName: file.originalname,
      size: file.size,
    };
  } catch (error) {
    throw new BadRequestException(
      `Failed to upload file to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Uploads base64 image data (from pasted screenshots) to Cloudinary
 */
export async function uploadBase64ImageToCloudinary(
  imageData: string,
  chatId: number
): Promise<FileUploadResult> {
  // Validate base64 data URI format
  if (!imageData.startsWith('data:image/')) {
    throw new BadRequestException('Invalid image data format. Expected data URI starting with "data:image/"');
  }

  // Extract mime type and base64 data
  const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new BadRequestException('Invalid base64 image data format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Validate image type
  const allowedMimeTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    throw new BadRequestException(`Unsupported image type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Calculate file size from base64 (approximate)
  const fileSize = Math.ceil((base64Data.length * 3) / 4);

  // Validate file size (50MB max)
  if (fileSize > MAX_FILE_SIZE) {
    throw new BadRequestException(
      `Image size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  const folder = `chat/${chatId}`;
  const fileName = generateFileName(`pasted-image.${mimeType}`);

  try {
    // Upload to Cloudinary
    const uploadOptions: UploadApiOptions = {
      folder,
      public_id: `${folder}/${fileName.replace(path.extname(fileName), '')}`,
      resource_type: 'image',
    };

    const result = await cloudinary.uploader.upload(imageData, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: 'image',
      originalName: `pasted-image.${mimeType}`,
      size: fileSize,
    };
  } catch (error) {
    throw new BadRequestException(
      `Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

