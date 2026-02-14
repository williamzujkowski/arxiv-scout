/**
 * Scout pipeline tests
 *
 * Validates the full research_* tool pipeline with mock responses.
 * Each test asserts on Zod-validated output shapes.
 */

import { describe, it, expect, vi } from 'vitest';
import type { ToolCaller } from './scout-pipeline.js';
import {
  discoverPapers,
  addPapers,
  queryStats,
  analyzeRegistry,
  reviewCatalog,
  runScoutPipeline,
  extractArxivId,
} from './scout-pipeline.js';
import {
  MOCK_DISCOVER_RESPONSE,
  MOCK_ADD_RESPONSE_SUCCESS,
  MOCK_QUERY_STATS_RESPONSE,
  MOCK_ANALYZE_GAPS_RESPONSE,
  MOCK_ANALYZE_COVERAGE_RESPONSE,
  MOCK_CATALOG_LIST_RESPONSE,
  MOCK_DISCOVER_ERROR,
} from './fixtures/mock-responses.js';
import type { ScoutConfig, DiscoverResponse } from './types.js';

// ============================================================================
// Mock tool caller
// ============================================================================

function createMockCaller(
  responses: Map<string, unknown>
): ToolCaller & { calls: Array<{ tool: string; args: Record<string, unknown> }> } {
  const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    call: vi.fn(async (toolName: string, args: Record<string, unknown>) => {
      calls.push({ tool: toolName, args });
      const response = responses.get(toolName);
      if (response === undefined) {
        throw new Error(`No mock for tool: ${toolName}`);
      }
      return response;
    }),
  };
}

const DEFAULT_CONFIG: ScoutConfig = {
  topic: 'multi-agent orchestration',
  maxResults: 10,
  source: 'arxiv',
  relevanceThreshold: 0.5,
  priority: 'P2',
  analysisFocuses: ['gaps', 'coverage'],
};

// ============================================================================
// extractArxivId
// ============================================================================

describe('extractArxivId', () => {
  it('extracts ID from standard arXiv URL', () => {
    expect(extractArxivId('https://arxiv.org/abs/2501.12345')).toBe(
      '2501.12345'
    );
  });

  it('extracts ID from PDF URL', () => {
    expect(extractArxivId('https://arxiv.org/pdf/2512.20237')).toBe(
      '2512.20237'
    );
  });

  it('extracts 5-digit ID', () => {
    expect(extractArxivId('https://arxiv.org/abs/2502.00789')).toBe(
      '2502.00789'
    );
  });

  it('returns undefined for non-arXiv URLs', () => {
    expect(extractArxivId('https://example.com/paper/no-arxiv-id')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(extractArxivId('')).toBeUndefined();
  });
});

// ============================================================================
// discoverPapers
// ============================================================================

describe('discoverPapers', () => {
  it('calls research_discover with correct args', async () => {
    const caller = createMockCaller(
      new Map([['research_discover', MOCK_DISCOVER_RESPONSE]])
    );

    const result = await discoverPapers(caller, DEFAULT_CONFIG);

    expect(caller.calls).toHaveLength(1);
    expect(caller.calls[0]?.tool).toBe('research_discover');
    expect(caller.calls[0]?.args).toEqual({
      topic: 'multi-agent orchestration',
      maxResults: 10,
      source: 'arxiv',
      relevanceThreshold: 0.5,
    });
    expect(result.topic).toBe('multi-agent orchestration');
    expect(result.items).toHaveLength(4);
    expect(result.totalFound).toBe(4);
  });

  it('validates response shape with Zod', async () => {
    const caller = createMockCaller(
      new Map([['research_discover', MOCK_DISCOVER_RESPONSE]])
    );

    const result = await discoverPapers(caller, DEFAULT_CONFIG);

    // All items have required fields
    for (const item of result.items) {
      expect(typeof item.source).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.url).toBe('string');
      expect(typeof item.alreadyInRegistry).toBe('boolean');
    }
  });

  it('rejects invalid response shape', async () => {
    const caller = createMockCaller(
      new Map([['research_discover', { invalid: true }]])
    );

    await expect(discoverPapers(caller, DEFAULT_CONFIG)).rejects.toThrow();
  });

  it('handles empty results', async () => {
    const caller = createMockCaller(
      new Map([['research_discover', MOCK_DISCOVER_ERROR]])
    );

    const result = await discoverPapers(caller, DEFAULT_CONFIG);

    expect(result.items).toHaveLength(0);
    expect(result.totalFound).toBe(0);
    expect(result.failedSources).toContain('semantic_scholar');
  });

  it('omits optional args when not configured', async () => {
    const caller = createMockCaller(
      new Map([['research_discover', MOCK_DISCOVER_RESPONSE]])
    );
    const minConfig: ScoutConfig = { topic: 'test' };

    await discoverPapers(caller, minConfig);

    expect(caller.calls[0]?.args).toEqual({ topic: 'test' });
  });
});

// ============================================================================
// addPapers
// ============================================================================

describe('addPapers', () => {
  it('adds only new papers with arXiv IDs', async () => {
    const caller = createMockCaller(
      new Map([['research_add', MOCK_ADD_RESPONSE_SUCCESS]])
    );

    const results = await addPapers(
      caller,
      MOCK_DISCOVER_RESPONSE,
      DEFAULT_CONFIG
    );

    // 4 items: 1 already in registry, 1 no arXiv ID = 2 added
    expect(results).toHaveLength(2);
    expect(caller.calls).toHaveLength(2);
  });

  it('skips papers already in registry', async () => {
    const caller = createMockCaller(
      new Map([['research_add', MOCK_ADD_RESPONSE_SUCCESS]])
    );

    const allTracked: DiscoverResponse = {
      ...MOCK_DISCOVER_RESPONSE,
      items: MOCK_DISCOVER_RESPONSE.items.map((item) => ({
        ...item,
        alreadyInRegistry: true,
      })),
    };

    const results = await addPapers(caller, allTracked, DEFAULT_CONFIG);

    expect(results).toHaveLength(0);
    expect(caller.calls).toHaveLength(0);
  });

  it('skips papers without arXiv IDs', async () => {
    const caller = createMockCaller(
      new Map([['research_add', MOCK_ADD_RESPONSE_SUCCESS]])
    );

    const noArxivItems: DiscoverResponse = {
      ...MOCK_DISCOVER_RESPONSE,
      items: [
        {
          source: 'github',
          title: 'GitHub Repo',
          url: 'https://github.com/user/repo',
          description: 'A repo',
          alreadyInRegistry: false,
          discoveredAt: '2026-02-13T12:00:00Z',
        },
      ],
    };

    const results = await addPapers(caller, noArxivItems, DEFAULT_CONFIG);

    expect(results).toHaveLength(0);
  });

  it('passes topic and priority to research_add', async () => {
    const caller = createMockCaller(
      new Map([['research_add', MOCK_ADD_RESPONSE_SUCCESS]])
    );

    const singleNew: DiscoverResponse = {
      ...MOCK_DISCOVER_RESPONSE,
      items: [MOCK_DISCOVER_RESPONSE.items[0]!],
    };

    await addPapers(caller, singleNew, DEFAULT_CONFIG);

    expect(caller.calls[0]?.args).toEqual({
      arxivId: '2501.12345',
      dryRun: false,
      topic: 'multi-agent orchestration',
      priority: 'P2',
    });
  });

  it('validates add response shape', async () => {
    const caller = createMockCaller(
      new Map([['research_add', MOCK_ADD_RESPONSE_SUCCESS]])
    );

    const singleNew: DiscoverResponse = {
      ...MOCK_DISCOVER_RESPONSE,
      items: [MOCK_DISCOVER_RESPONSE.items[0]!],
    };

    const results = await addPapers(caller, singleNew, DEFAULT_CONFIG);

    expect(results[0]?.success).toBe(true);
    expect(results[0]?.paperId).toBe('arxiv-2501.12345');
    expect(typeof results[0]?.message).toBe('string');
  });
});

// ============================================================================
// queryStats
// ============================================================================

describe('queryStats', () => {
  it('calls research_query with stats action', async () => {
    const caller = createMockCaller(
      new Map([['research_query', MOCK_QUERY_STATS_RESPONSE]])
    );

    const result = await queryStats(caller);

    expect(caller.calls[0]?.tool).toBe('research_query');
    expect(caller.calls[0]?.args).toEqual({ action: 'stats' });
    expect(result.action).toBe('stats');
    expect(result.success).toBe(true);
  });

  it('rejects invalid response', async () => {
    const caller = createMockCaller(
      new Map([['research_query', 'not an object']])
    );

    await expect(queryStats(caller)).rejects.toThrow();
  });
});

// ============================================================================
// analyzeRegistry
// ============================================================================

describe('analyzeRegistry', () => {
  it('runs all configured analysis focuses', async () => {
    let callCount = 0;
    const responses = [MOCK_ANALYZE_GAPS_RESPONSE, MOCK_ANALYZE_COVERAGE_RESPONSE];
    const caller: ToolCaller = {
      call: vi.fn(async () => {
        return responses[callCount++];
      }),
    };

    const results = await analyzeRegistry(caller, DEFAULT_CONFIG);

    expect(results).toHaveLength(2);
    expect(results[0]?.focus).toBe('gaps');
    expect(results[1]?.focus).toBe('coverage');
  });

  it('defaults to gaps and coverage when no focuses specified', async () => {
    const calls: Record<string, unknown>[] = [];
    const caller: ToolCaller = {
      call: vi.fn(async (_tool: string, args: Record<string, unknown>) => {
        calls.push(args);
        return MOCK_ANALYZE_GAPS_RESPONSE;
      }),
    };

    await analyzeRegistry(caller, { topic: 'test' });

    expect(calls).toHaveLength(2);
    expect(calls[0]?.focus).toBe('gaps');
    expect(calls[1]?.focus).toBe('coverage');
  });

  it('validates analysis recommendations', async () => {
    const caller = createMockCaller(
      new Map([['research_analyze', MOCK_ANALYZE_GAPS_RESPONSE]])
    );
    const config: ScoutConfig = {
      topic: 'test',
      analysisFocuses: ['gaps'],
    };

    const results = await analyzeRegistry(caller, config);

    expect(results[0]?.recommendations).toBeInstanceOf(Array);
    expect(results[0]!.recommendations.length).toBeGreaterThan(0);
    expect(typeof results[0]!.recommendations[0]).toBe('string');
  });
});

// ============================================================================
// reviewCatalog
// ============================================================================

describe('reviewCatalog', () => {
  it('calls research_catalog_review with list action', async () => {
    const caller = createMockCaller(
      new Map([['research_catalog_review', MOCK_CATALOG_LIST_RESPONSE]])
    );

    const result = await reviewCatalog(caller);

    expect(result.action).toBe('list');
    expect(result.success).toBe(true);
    expect(typeof result.message).toBe('string');
  });

  it('validates catalog response shape', async () => {
    const caller = createMockCaller(
      new Map([['research_catalog_review', MOCK_CATALOG_LIST_RESPONSE]])
    );

    const result = await reviewCatalog(caller);

    expect(result).toHaveProperty('action');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
  });
});

// ============================================================================
// Full pipeline
// ============================================================================

describe('runScoutPipeline', () => {
  it('executes all 5 steps in order', async () => {
    const toolResponses: Record<string, unknown> = {
      research_discover: MOCK_DISCOVER_RESPONSE,
      research_add: MOCK_ADD_RESPONSE_SUCCESS,
      research_query: MOCK_QUERY_STATS_RESPONSE,
      research_analyze: MOCK_ANALYZE_GAPS_RESPONSE,
      research_catalog_review: MOCK_CATALOG_LIST_RESPONSE,
    };
    const callOrder: string[] = [];
    const caller: ToolCaller = {
      call: vi.fn(async (toolName: string, args: Record<string, unknown>) => {
        callOrder.push(toolName);
        const response = toolResponses[toolName];
        if (response === undefined) throw new Error(`No mock: ${toolName}`);
        return response;
      }),
    };

    const result = await runScoutPipeline(caller, DEFAULT_CONFIG);

    // Verify call order: discover → add (×2) → query → analyze (×2) → catalog
    expect(callOrder[0]).toBe('research_discover');
    expect(callOrder.filter((t) => t === 'research_add')).toHaveLength(2);
    expect(callOrder).toContain('research_query');
    expect(callOrder.filter((t) => t === 'research_analyze')).toHaveLength(2);
    expect(callOrder[callOrder.length - 1]).toBe('research_catalog_review');

    // Verify result shape
    expect(result.discovered.topic).toBe('multi-agent orchestration');
    expect(result.added).toHaveLength(2);
    expect(result.queryStats.success).toBe(true);
    expect(result.analyses).toHaveLength(2);
    expect(result.catalogReview.success).toBe(true);
  });

  it('handles empty discovery results gracefully', async () => {
    const toolResponses: Record<string, unknown> = {
      research_discover: MOCK_DISCOVER_ERROR,
      research_query: MOCK_QUERY_STATS_RESPONSE,
      research_analyze: MOCK_ANALYZE_GAPS_RESPONSE,
      research_catalog_review: MOCK_CATALOG_LIST_RESPONSE,
    };
    const caller: ToolCaller = {
      call: vi.fn(async (toolName: string) => {
        const response = toolResponses[toolName];
        if (response === undefined) throw new Error(`No mock: ${toolName}`);
        return response;
      }),
    };

    const result = await runScoutPipeline(caller, DEFAULT_CONFIG);

    expect(result.discovered.items).toHaveLength(0);
    expect(result.added).toHaveLength(0);
    expect(result.queryStats.success).toBe(true);
  });

  it('propagates tool errors', async () => {
    const caller: ToolCaller = {
      call: vi.fn(async () => {
        throw new Error('MCP tool timeout');
      }),
    };

    await expect(
      runScoutPipeline(caller, DEFAULT_CONFIG)
    ).rejects.toThrow('MCP tool timeout');
  });
});
