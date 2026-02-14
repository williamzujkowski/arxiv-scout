/**
 * arxiv-scout pipeline
 *
 * Chains all 5 research_* MCP tools in a realistic discovery workflow:
 * discover → add → query → analyze → catalog_review
 */

import type {
  ScoutConfig,
  ScoutResult,
  DiscoverResponse,
  AddResponse,
  QueryResponse,
  AnalyzeResponse,
  CatalogReviewResponse,
} from './types.js';
import {
  DiscoverResponseSchema,
  AddResponseSchema,
  QueryResponseSchema,
  AnalyzeResponseSchema,
  CatalogReviewResponseSchema,
} from './types.js';

// ============================================================================
// Tool caller abstraction (injectable for testing)
// ============================================================================

/** Generic MCP tool caller — returns parsed JSON from tool response. */
export interface ToolCaller {
  call(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// Pipeline steps
// ============================================================================

/** Step 1: Discover papers matching the topic. */
export async function discoverPapers(
  caller: ToolCaller,
  config: ScoutConfig
): Promise<DiscoverResponse> {
  const args: Record<string, unknown> = { topic: config.topic };
  if (config.maxResults !== undefined) args['maxResults'] = config.maxResults;
  if (config.source !== undefined) args['source'] = config.source;
  if (config.relevanceThreshold !== undefined)
    args['relevanceThreshold'] = config.relevanceThreshold;
  if (config.sinceDate !== undefined) args['sinceDate'] = config.sinceDate;

  const raw = await caller.call('research_discover', args);
  return DiscoverResponseSchema.parse(raw);
}

/** Step 2: Add newly discovered papers to the registry. */
export async function addPapers(
  caller: ToolCaller,
  discovered: DiscoverResponse,
  config: ScoutConfig
): Promise<AddResponse[]> {
  const results: AddResponse[] = [];

  for (const item of discovered.items) {
    // Only add new items (not already in registry)
    if (item.alreadyInRegistry) continue;

    // Extract arXiv ID from URL if present
    const arxivId = extractArxivId(item.url);
    if (arxivId === undefined) continue;

    const args: Record<string, unknown> = { arxivId, dryRun: false };
    if (config.topic !== undefined) args['topic'] = config.topic;
    if (config.priority !== undefined) args['priority'] = config.priority;

    const raw = await caller.call('research_add', args);
    results.push(AddResponseSchema.parse(raw));
  }

  return results;
}

/** Step 3: Query registry stats after adding papers. */
export async function queryStats(
  caller: ToolCaller
): Promise<QueryResponse> {
  const raw = await caller.call('research_query', {
    action: 'stats',
  });
  return QueryResponseSchema.parse(raw);
}

/** Step 4: Analyze the registry for gaps, trends, etc. */
export async function analyzeRegistry(
  caller: ToolCaller,
  config: ScoutConfig
): Promise<AnalyzeResponse[]> {
  const focuses = config.analysisFocuses ?? ['gaps', 'coverage'];
  const results: AnalyzeResponse[] = [];

  for (const focus of focuses) {
    const args: Record<string, unknown> = { focus };
    if (config.topic !== undefined) args['topic'] = config.topic;

    const raw = await caller.call('research_analyze', args);
    results.push(AnalyzeResponseSchema.parse(raw));
  }

  return results;
}

/** Step 5: Review auto-cataloged references. */
export async function reviewCatalog(
  caller: ToolCaller
): Promise<CatalogReviewResponse> {
  const raw = await caller.call('research_catalog_review', {
    action: 'list',
  });
  return CatalogReviewResponseSchema.parse(raw);
}

// ============================================================================
// Full pipeline
// ============================================================================

/** Run the complete scout pipeline: discover → add → query → analyze → review. */
export async function runScoutPipeline(
  caller: ToolCaller,
  config: ScoutConfig
): Promise<ScoutResult> {
  const discovered = await discoverPapers(caller, config);
  const added = await addPapers(caller, discovered, config);
  const queryStatsResult = await queryStats(caller);
  const analyses = await analyzeRegistry(caller, config);
  const catalogReview = await reviewCatalog(caller);

  return {
    discovered,
    added,
    queryStats: queryStatsResult,
    analyses,
    catalogReview,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/** Extract arXiv ID from a URL like https://arxiv.org/abs/2401.12345 */
export function extractArxivId(url: string): string | undefined {
  const match = /(\d{4}\.\d{4,5})/.exec(url);
  return match !== null ? match[1] : undefined;
}
