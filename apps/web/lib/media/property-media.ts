/** Shared helpers for listing photos + videos (property-media bucket). */

import { compressImageFile } from './compress-image';

export const PROPERTY_MEDIA_ACCEPT =
  'image/*,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v';

/** Soft cap for mobile uploads — videos stay original (no client re-encode). */
export const MAX_PROPERTY_VIDEO_BYTES = 80 * 1024 * 1024;

export type PropertyMediaKind = 'image' | 'video';

const VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/m4v',
]);

export function isImageMediaFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isVideoMediaFile(file: File): boolean {
  if (VIDEO_MIME.has(file.type)) return true;
  if (file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

export function isAcceptedPropertyMediaFile(file: File): boolean {
  return isImageMediaFile(file) || isVideoMediaFile(file);
}

export function mediaKindFromFile(file: File): PropertyMediaKind {
  return isVideoMediaFile(file) ? 'video' : 'image';
}

export function mediaKindFromUrl(
  url: string | null | undefined,
  kind?: string | null,
): PropertyMediaKind {
  if (kind === 'video' || kind === 'image') return kind;
  if (!url) return 'image';
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return 'video';
  return 'image';
}

export function extensionForMediaFile(file: File, preparedType?: string): string {
  const type = preparedType ?? file.type;
  if (type === 'image/webp') return 'webp';
  if (type === 'image/png') return 'png';
  if (type.startsWith('image/')) return 'jpg';
  if (type === 'video/webm') return 'webm';
  if (type === 'video/quicktime') return 'mov';
  if (/\.mov$/i.test(file.name)) return 'mov';
  if (/\.webm$/i.test(file.name)) return 'webm';
  if (/\.m4v$/i.test(file.name)) return 'm4v';
  return 'mp4';
}

/**
 * Images are compressed; videos are uploaded as-is (with size guard).
 */
export async function preparePropertyMediaFile(file: File): Promise<File> {
  if (isVideoMediaFile(file)) {
    if (file.size > MAX_PROPERTY_VIDEO_BYTES) {
      throw new Error('VIDEO_TOO_LARGE');
    }
    return file;
  }
  if (!isImageMediaFile(file)) {
    throw new Error('UNSUPPORTED_MEDIA');
  }
  return compressImageFile(file);
}
