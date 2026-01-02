/**
 * Supabase Storage service for file uploads
 */

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from './supabase';

/**
 * Upload an avatar image to Supabase Storage
 *
 * @param userId - User ID (used as folder name for organization)
 * @param localUri - Local file URI (file://...)
 * @returns Public URL of the uploaded image
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  console.log('[Storage] Uploading avatar for user:', userId);
  console.log('[Storage] Local URI:', localUri);

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });

  // Determine file extension from URI
  const uriParts = localUri.split('.');
  let ext = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';

  // Normalize extension
  if (ext === 'jpeg') ext = 'jpg';
  if (!['jpg', 'png', 'webp'].includes(ext)) ext = 'jpg';

  // Generate unique filename: {userId}/{timestamp}.{ext}
  const fileName = `${userId}/${Date.now()}.${ext}`;
  console.log('[Storage] Uploading to path:', fileName);

  // Determine content type
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, decode(base64), {
      contentType,
      upsert: true, // Replace if exists
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(error.message);
  }

  console.log('[Storage] Upload successful, path:', data.path);

  // Get public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);

  console.log('[Storage] Public URL:', urlData.publicUrl);

  return urlData.publicUrl;
}

/**
 * Delete an avatar from Supabase Storage
 *
 * @param avatarUrl - Full public URL of the avatar
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/avatars/{path}
  const match = avatarUrl.match(/avatars\/(.+)$/);
  if (!match) {
    console.warn('[Storage] Could not extract path from URL:', avatarUrl);
    return;
  }

  const path = match[1];
  console.log('[Storage] Deleting avatar at path:', path);

  const { error } = await supabase.storage.from('avatars').remove([path]);

  if (error) {
    console.error('[Storage] Delete error:', error);
    throw new Error(error.message);
  }

  console.log('[Storage] Avatar deleted successfully');
}
