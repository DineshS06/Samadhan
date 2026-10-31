/**
 * Shared markdown formatting helpers for AI-readable page renderers.
 * Pure functions — no fetch, no side effects, no HTML scraping.
 */

/** Convert a heading level (1-6) and text into a markdown heading. */
export function heading(level: number, text: string): string {
  return `${'#'.repeat(level)} ${text}\n`;
}

/** Build an absolute URL from a path. */
export function absoluteLink(path: string): string {
  const base = 'https://samadhan-chi.vercel.app';
  return base + (path.startsWith('/') ? path : '/' + path);
}

/** Render a markdown table from headers and rows. */
export function table(headers: string[], rows: string[][]): string {
  const line = (cells: string[]) => '| ' + cells.join(' | ') + ' |';
  const sep = '| ' + headers.map(() => '---').join(' | ') + ' |';
  return [line(headers), sep, ...rows.map(line)].join('\n') + '\n';
}

/** Render a bulleted list from items. */
export function list(items: string[]): string {
  return items.map((i) => '- ' + i).join('\n') + '\n';
}

/** Render a date string as YYYY-MM-DD. */
export function dateString(d: Date = new Date()): string {
  return d.toISOString().split('T')[0];
}

/** Escape markdown special characters in inline text. */
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
}

/** Render an FAQ block: ### Question + answer paragraph. */
export function faqBlock(question: string, answer: string): string {
  return `### ${escapeMarkdown(question)}\n\n${escapeMarkdown(answer)}\n`;
}

/** Build the standard page header block (title, summary, canonical, last updated). */
export function pageHeader(
  title: string,
  summary: string,
  path: string,
  lastUpdated: string,
): string {
  const canonical = absoluteLink(path);
  return [
    heading(1, title),
    `> ${summary}\n`,
    `**Canonical URL:** ${canonical}\n`,
    `**Last Updated:** ${lastUpdated}\n`,
  ].join('');
}

/** Build the Related links section from [label, path] pairs. */
export function relatedSection(links: [string, string][]): string {
  const lines = ['## Related\n'];
  for (const [label, url] of links) {
    lines.push(`- [${escapeMarkdown(label)}](${absoluteLink(url)})`);
  }
  return lines.join('\n') + '\n';
}
