import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw';
  transformation?: any;
  tags?: string[];
  context?: Record<string, string>;
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
  file: Buffer | string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || 'winrich-images',
      overwrite: options.overwrite || false,
      resource_type: options.resource_type || 'image',
      tags: options.tags || [],
      context: options.context || {},
      ...options.transformation && { transformation: options.transformation }
    };

    let result;
    if (typeof file === 'string') {
      // Upload from URL
      result = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      // Upload from buffer
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, res) => {
          if (error) return reject(error);
          resolve(res);
        });
        stream.end(file);
      });
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get image info from Cloudinary
 */
export async function getImageInfo(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    throw error;
  }
}

/**
 * Generate optimized URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'scale' | 'fit' | 'thumb';
    gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west';
  } = {}
): string {
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);

  const transformationString = transformations.join(',');
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformationString ? [transformationString] : undefined
  });
}

/**
 * Generate responsive URLs for different screen sizes
 */
export function getResponsiveUrls(
  publicId: string,
  sizes: Array<{ width: number; quality?: number }>
): string {
  return sizes
    .map(size => {
      const url = getOptimizedUrl(publicId, {
        width: size.width,
        quality: size.quality || 80,
        format: 'auto',
        crop: 'fill'
      });
      return `${url} ${size.width}w`;
    })
    .join(', ');
}

/**
 * List images from Cloudinary
 */
export async function listImages(options: {
  max_results?: number;
  next_cursor?: string;
  folder?: string;
  tags?: string[];
} = {}): Promise<{
  resources: any[];
  next_cursor?: string;
}> {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: options.max_results || 50,
      next_cursor: options.next_cursor,
      prefix: options.folder,
      tags: options.tags,
      sort_by: 'created_at',
      sort_direction: 'desc'
    });

    return {
      resources: result.resources,
      next_cursor: result.next_cursor
    };
  } catch (error) {
    console.error('Cloudinary list images error:', error);
    throw error;
  }
}

/**
 * Search images in Cloudinary
 */
export async function searchImages(query: string, options: {
  max_results?: number;
  next_cursor?: string;
  folder?: string;
} = {}): Promise<{
  resources: any[];
  next_cursor?: string;
}> {
  try {
    const result = await cloudinary.search
      .expression(query)
      .sort_by('created_at', 'desc')
      .max_results(options.max_results || 50)
      .next_cursor(options.next_cursor)
      .execute();

    return {
      resources: result.resources,
      next_cursor: result.next_cursor
    };
  } catch (error) {
    console.error('Cloudinary search images error:', error);
    throw error;
  }
}

export default cloudinary;
