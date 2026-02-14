/**
 * Digest generator
 *
 * Formats scout pipeline results into a readable digest.
 */

import type { ScoutResult } from './types.js';

export interface DigestOptions {
  readonly format: 'markdown' | 'json' | 'text';
  readonly includeAnalysis?: boolean;
}

/** Generate a digest from scout results. */
export function generateDigest(
  result: ScoutResult,
  options: DigestOptions
): string {
  if (options.format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (options.format === 'markdown') {
    return generateMarkdownDigest(result, options);
  }

  return generateTextDigest(result);
}

function generateMarkdownDigest(
  result: ScoutResult,
  options: DigestOptions
): string {
  const lines: string[] = [];

  lines.push(`# Research Scout Digest`);
  lines.push(`**Topic:** ${result.discovered.topic}`);
  lines.push(`**Papers found:** ${String(result.discovered.totalFound)}`);
  lines.push(`**New papers:** ${String(result.discovered.newItems)}`);
  lines.push(
    `**Already tracked:** ${String(result.discovered.alreadyInRegistry)}`
  );
  lines.push('');

  if (result.discovered.items.length > 0) {
    lines.push('## Discovered Papers');
    for (const item of result.discovered.items) {
      const badge = item.alreadyInRegistry ? ' (tracked)' : ' (new)';
      lines.push(`- **${item.title}**${badge}`);
      lines.push(`  ${item.url}`);
      if (item.relevanceScore !== undefined) {
        lines.push(
          `  Relevance: ${String(Math.round(item.relevanceScore * 100))}%`
        );
      }
    }
    lines.push('');
  }

  if (result.added.length > 0) {
    lines.push('## Added to Registry');
    for (const paper of result.added) {
      const status = paper.success ? 'OK' : 'FAILED';
      lines.push(`- [${status}] ${paper.paperId}: ${paper.title}`);
    }
    lines.push('');
  }

  if (options.includeAnalysis !== false && result.analyses.length > 0) {
    lines.push('## Analysis');
    for (const analysis of result.analyses) {
      lines.push(`### ${analysis.focus}`);
      if (analysis.recommendations.length > 0) {
        for (const rec of analysis.recommendations) {
          lines.push(`- ${rec}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('## Catalog Status');
  lines.push(`${result.catalogReview.message}`);

  return lines.join('\n');
}

function generateTextDigest(result: ScoutResult): string {
  const lines: string[] = [];
  lines.push(`Research Scout: ${result.discovered.topic}`);
  lines.push(`Found ${String(result.discovered.totalFound)} papers`);
  lines.push(`New: ${String(result.discovered.newItems)}`);
  lines.push(`Tracked: ${String(result.discovered.alreadyInRegistry)}`);
  lines.push(`Added: ${String(result.added.length)}`);
  lines.push(`Analyses: ${String(result.analyses.length)}`);
  lines.push(`Catalog: ${result.catalogReview.message}`);
  return lines.join('\n');
}
