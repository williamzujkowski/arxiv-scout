/**
 * arxiv-scout types
 *
 * Zod schemas matching the nexus-agents research_* MCP tool contracts.
 */

import { z } from 'zod';

// ============================================================================
// research_discover
// ============================================================================

export const DiscoverInputSchema = z.object({
  topic: z.string().min(1).max(200),
  source: z
    .enum([
      'arxiv',
      'github',
      'google_ai',
      'meta_fair',
      'microsoft',
      'deepmind',
      'semantic_scholar',
      'papers_with_code',
      'openalex',
      'all',
    ])
    .optional(),
  maxResults: z.number().min(1).max(20).optional(),
  sinceDate: z.string().optional(),
  relevanceThreshold: z.number().min(0).max(1).optional(),
});

export type DiscoverInput = z.infer<typeof DiscoverInputSchema>;

export const DiscoverItemSchema = z.object({
  source: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string(),
  alreadyInRegistry: z.boolean(),
  discoveredAt: z.string(),
  relevanceScore: z.number().optional(),
});

export const DiscoverResponseSchema = z.object({
  topic: z.string(),
  sourcesQueried: z.array(z.string()),
  failedSources: z.array(z.string()),
  items: z.array(DiscoverItemSchema),
  totalFound: z.number(),
  alreadyInRegistry: z.number(),
  newItems: z.number(),
});

export type DiscoverResponse = z.infer<typeof DiscoverResponseSchema>;

// ============================================================================
// research_add
// ============================================================================

export const AddInputSchema = z.object({
  arxivId: z.string().regex(/^\d{4}\.\d{4,5}$/),
  topic: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  dryRun: z.boolean().optional(),
});

export type AddInput = z.infer<typeof AddInputSchema>;

export const AddResponseSchema = z.object({
  success: z.boolean(),
  paperId: z.string(),
  title: z.string(),
  message: z.string(),
  dryRun: z.boolean(),
});

export type AddResponse = z.infer<typeof AddResponseSchema>;

// ============================================================================
// research_query
// ============================================================================

export const QueryInputSchema = z.object({
  action: z.enum(['status', 'overlap', 'stats', 'search']),
  techniqueId: z.string().optional(),
  query: z.string().optional(),
  status: z
    .enum(['implemented', 'planned', 'not-started', 'rejected', 'all'])
    .optional(),
  threshold: z.number().min(0).max(1).optional(),
});

export type QueryInput = z.infer<typeof QueryInputSchema>;

export const QueryResponseSchema = z.object({
  action: z.string(),
  success: z.boolean(),
  data: z.unknown(),
});

export type QueryResponse = z.infer<typeof QueryResponseSchema>;

// ============================================================================
// research_analyze
// ============================================================================

export const AnalyzeInputSchema = z.object({
  focus: z.enum(['gaps', 'trends', 'priorities', 'stale', 'coverage']),
  topic: z.string().optional(),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export const AnalyzeResponseSchema = z.object({
  focus: z.string(),
  success: z.boolean(),
  analysis: z.unknown(),
  recommendations: z.array(z.string()),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// ============================================================================
// research_catalog_review
// ============================================================================

export const CatalogReviewInputSchema = z.object({
  action: z.enum(['list', 'approve', 'dismiss', 'flush']),
  identifier: z.string().optional(),
  topic: z.string().optional(),
  createIssue: z.boolean().optional(),
});

export type CatalogReviewInput = z.infer<typeof CatalogReviewInputSchema>;

export const CatalogReviewResponseSchema = z.object({
  action: z.string(),
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

export type CatalogReviewResponse = z.infer<typeof CatalogReviewResponseSchema>;

// ============================================================================
// Pipeline types
// ============================================================================

export interface ScoutConfig {
  /** Research topic to scan. */
  readonly topic: string;
  /** Maximum papers to discover. */
  readonly maxResults?: number;
  /** Source to search. */
  readonly source?: DiscoverInput['source'];
  /** Minimum relevance score (0-1). */
  readonly relevanceThreshold?: number;
  /** Only papers after this date (YYYY-MM-DD). */
  readonly sinceDate?: string;
  /** Priority for new papers. */
  readonly priority?: AddInput['priority'];
  /** Analysis focus areas to run. */
  readonly analysisFocuses?: AnalyzeInput['focus'][];
}

export interface ScoutResult {
  readonly discovered: DiscoverResponse;
  readonly added: AddResponse[];
  readonly queryStats: QueryResponse;
  readonly analyses: AnalyzeResponse[];
  readonly catalogReview: CatalogReviewResponse;
}
