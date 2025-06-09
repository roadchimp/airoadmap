/**
 * Returns the base URL for the current environment.
 * @returns {string} The base URL.
 */
export function getBaseUrl(): string {
  // 1. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 2. Custom public API URL (for local or other environments)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 3. Fallback to localhost for local development
  return 'http://localhost:3000';
} 