/** Client-side image compression via canvas — no extra dependency. */

export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
};

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.82;
  const mimeType = options.mimeType ?? 'image/jpeg';

  if (!file.type.startsWith('image/')) {
    throw new Error('Ficheiro inválido: apenas imagens.');
  }

  // Skip tiny files
  if (file.size < 180_000 && file.type === mimeType) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality),
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${base}.${ext}`, { type: mimeType, lastModified: Date.now() });
}

export function revokeObjectUrls(urls: string[]) {
  for (const url of urls) URL.revokeObjectURL(url);
}
