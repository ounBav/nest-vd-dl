import { isAllowedMediaUrl } from './mediaChecker';

describe('isAllowedMediaUrl', () => {
  it('returns true for supported TikTok URLs', () => {
    expect(isAllowedMediaUrl('https://www.tiktok.com/@example/video/123')).toBe(
      true,
    );
  });

  it('returns true for supported YouTube URLs', () => {
    expect(isAllowedMediaUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('returns false for unsupported domains', () => {
    expect(isAllowedMediaUrl('https://example.com/video')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isAllowedMediaUrl('not-a-url')).toBe(false);
  });
});
