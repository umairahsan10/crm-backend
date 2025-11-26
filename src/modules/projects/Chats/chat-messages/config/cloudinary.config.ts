import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djqmhkla6',
  api_key: process.env.CLOUDINARY_API_KEY || '432665672272245',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'wYvdCPifg-2_tlf7D41edsvF0jU',
});

export { cloudinary };

