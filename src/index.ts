/**
 * arxiv-scout — Research paper discovery pipeline
 *
 * E2E test project for nexus-agents research_* MCP tools.
 * Exercises: research_discover, research_add, research_query,
 * research_analyze, research_catalog_review.
 */

export type { ToolCaller } from './scout-pipeline.js';
export {
  runScoutPipeline,
  discoverPapers,
  addPapers,
  queryStats,
  analyzeRegistry,
  reviewCatalog,
  extractArxivId,
} from './scout-pipeline.js';
export { generateDigest, type DigestOptions } from './digest.js';
export type {
  ScoutConfig,
  ScoutResult,
  DiscoverInput,
  DiscoverResponse,
  AddInput,
  AddResponse,
  QueryInput,
  QueryResponse,
  AnalyzeInput,
  AnalyzeResponse,
  CatalogReviewInput,
  CatalogReviewResponse,
} from './types.js';
export {
  DiscoverInputSchema,
  DiscoverResponseSchema,
  AddInputSchema,
  AddResponseSchema,
  QueryInputSchema,
  QueryResponseSchema,
  AnalyzeInputSchema,
  AnalyzeResponseSchema,
  CatalogReviewInputSchema,
  CatalogReviewResponseSchema,
} from './types.js';
