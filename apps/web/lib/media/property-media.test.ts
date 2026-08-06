import { describe, expect, it } from 'vitest';
import {
  extensionForMediaFile,
  isAcceptedPropertyMediaFile,
  isImageMediaFile,
  isVideoMediaFile,
  mediaKindFromFile,
  mediaKindFromUrl,
  MAX_PROPERTY_VIDEO_BYTES,
} from './property-media';

function fakeFile(name: string, type: string, size = 1024): File {
  const blob = new Blob([new Uint8Array(Math.min(size, 64))], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

describe('property-media helpers', () => {
  it('accepts images and common video types', () => {
    expect(isAcceptedPropertyMediaFile(fakeFile('a.jpg', 'image/jpeg'))).toBe(true);
    expect(isAcceptedPropertyMediaFile(fakeFile('a.mp4', 'video/mp4'))).toBe(true);
    expect(isAcceptedPropertyMediaFile(fakeFile('a.mov', 'video/quicktime'))).toBe(true);
    expect(isAcceptedPropertyMediaFile(fakeFile('a.pdf', 'application/pdf'))).toBe(false);
  });

  it('detects kind from file and URL', () => {
    expect(mediaKindFromFile(fakeFile('clip.mp4', 'video/mp4'))).toBe('video');
    expect(mediaKindFromFile(fakeFile('foto.webp', 'image/webp'))).toBe('image');
    expect(mediaKindFromUrl('https://cdn.example/x.mp4')).toBe('video');
    expect(mediaKindFromUrl('https://cdn.example/x.jpg')).toBe('image');
    expect(mediaKindFromUrl('https://cdn.example/x', 'video')).toBe('video');
  });

  it('picks storage extensions', () => {
    expect(extensionForMediaFile(fakeFile('a.jpg', 'image/jpeg'), 'image/jpeg')).toBe('jpg');
    expect(extensionForMediaFile(fakeFile('a.webp', 'image/webp'), 'image/webp')).toBe('webp');
    expect(extensionForMediaFile(fakeFile('a.mp4', 'video/mp4'), 'video/mp4')).toBe('mp4');
    expect(extensionForMediaFile(fakeFile('a.mov', 'video/quicktime'), 'video/quicktime')).toBe(
      'mov',
    );
  });

  it('exposes a video size limit for client validation', () => {
    expect(MAX_PROPERTY_VIDEO_BYTES).toBe(80 * 1024 * 1024);
    expect(isImageMediaFile(fakeFile('a.png', 'image/png'))).toBe(true);
    expect(isVideoMediaFile(fakeFile('tour.webm', 'video/webm'))).toBe(true);
  });
});
