// src/lib/imageUpload.ts
import imageCompression from 'browser-image-compression';
import { createClient } from './supabase';

export interface ImageUploadResult {
  url: string;
  error?: never;
}

export interface ImageUploadError {
  url?: never;
  error: string;
}

export type ImageUploadResponse = ImageUploadResult | ImageUploadError;

/**
 * Upload an image to Supabase Storage with compression
 * @param file The image file to upload
 * @param cardId The card ID for the file path
 * @param field Whether this is a term or definition image
 * @returns Public URL of the uploaded image or error
 */
export async function uploadCardImage(
  file: File,
  cardId: string,
  field: 'term' | 'definition'
): Promise<ImageUploadResponse> {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Compress the image
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${cardId}-${field}.${extension}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('flashcards-images')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('flashcards-images')
      .getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl The public URL of the image to delete
 * @returns Success or error
 */
export async function deleteCardImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Extract the file path from the public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/flashcards-images/{userId}/{cardId}.{ext}
    const urlParts = imageUrl.split('/flashcards-images/');
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid image URL' };
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('flashcards-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
