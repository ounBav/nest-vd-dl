// utils/mediaChecker.ts

const allowedDomains = [
  'tiktok.com',
  'vt.tiktok.com',
  'youtube.com',
  'youtu.be',
  'instagram.com',
  'twitter.com',
  'facebook.com',
  // add more supported domains here
];

/**
 * Check if a given URL is allowed for yt-dlp download
 * @param url string - input URL
 * @returns boolean - true if allowed
 */
export function isAllowedMediaUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url.toLowerCase());

    // Check if hostname ends with any allowed domain
    return allowedDomains.some((domain) => parsedUrl.hostname.endsWith(domain));
  } catch {
    // Invalid URL format
    return false;
  }
}

