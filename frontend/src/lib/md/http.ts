/**
 * HTTP response helpers for AI-readable markdown endpoints.
 * Builds the header object required by the ScrollLaunch spec.
 */

import { dateString } from './format';

/**
 * Build response headers for a markdown response.
 *
 * @param path - The HTML route path (e.g. "/faq"), used for Content-Location.
 * @param contentLength - Byte length of the markdown body.
 * @param lastUpdated - Optional ISO date string for Last-Modified.
 */
export function markdownHeaders(
  path: string,
  contentLength: number,
  lastUpdated?: string,
): Record<string, string> {
  const canonical = 'https://samadhan-chi.vercel.app' +
    (path.startsWith('/') ? path : '/' + path);
  const tokens = Math.max(1, Math.floor(contentLength / 4));
  const headers: Record<string, string> = {
    'Content-Type': 'text/markdown; charset=utf-8',
    'X-Markdown-Tokens': String(tokens),
    'X-Robots-Tag': 'noindex, follow',
    'Content-Location': canonical,
    'Link': `<${canonical}>; rel="canonical"`,
    'Vary': 'Accept',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
  };
  if (lastUpdated) {
    headers['Last-Modified'] = lastUpdated;
  }
  return headers;
}

/** Estimate markdown token count from character count (chars / 4). */
export function estimateTokens(content: string): number {
  return Math.max(1, Math.floor(content.length / 4));
}
