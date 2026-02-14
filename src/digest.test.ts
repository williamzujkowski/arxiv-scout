/**
 * Digest generator tests
 */

import { describe, it, expect } from 'vitest';
import { generateDigest } from './digest.js';
import type { ScoutResult } from './types.js';
import {
  MOCK_DISCOVER_RESPONSE,
  MOCK_ADD_RESPONSE_SUCCESS,
  MOCK_QUERY_STATS_RESPONSE,
  MOCK_ANALYZE_GAPS_RESPONSE,
  MOCK_ANALYZE_COVERAGE_RESPONSE,
  MOCK_CATALOG_LIST_RESPONSE,
} from './fixtures/mock-responses.js';

const MOCK_RESULT: ScoutResult = {
  discovered: MOCK_DISCOVER_RESPONSE,
  added: [MOCK_ADD_RESPONSE_SUCCESS],
  queryStats: MOCK_QUERY_STATS_RESPONSE,
  analyses: [MOCK_ANALYZE_GAPS_RESPONSE, MOCK_ANALYZE_COVERAGE_RESPONSE],
  catalogReview: MOCK_CATALOG_LIST_RESPONSE,
};

describe('generateDigest', () => {
  describe('markdown format', () => {
    it('includes topic header', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('# Research Scout Digest');
      expect(md).toContain('multi-agent orchestration');
    });

    it('lists discovered papers with badges', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('(new)');
      expect(md).toContain('(tracked)');
    });

    it('includes paper counts', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('Papers found:** 4');
      expect(md).toContain('New papers:** 3');
    });

    it('includes added papers section', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('Added to Registry');
      expect(md).toContain('arxiv-2501.12345');
    });

    it('includes analysis recommendations', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('## Analysis');
      expect(md).toContain('latency-aware scheduling');
    });

    it('includes relevance scores when present', () => {
      const md = generateDigest(MOCK_RESULT, { format: 'markdown' });
      expect(md).toContain('Relevance: 92%');
    });

    it('can exclude analysis', () => {
      const md = generateDigest(MOCK_RESULT, {
        format: 'markdown',
        includeAnalysis: false,
      });
      expect(md).not.toContain('## Analysis');
    });
  });

  describe('json format', () => {
    it('returns valid JSON', () => {
      const json = generateDigest(MOCK_RESULT, { format: 'json' });
      const parsed: unknown = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('preserves full result structure', () => {
      const json = generateDigest(MOCK_RESULT, { format: 'json' });
      const parsed = JSON.parse(json) as ScoutResult;
      expect(parsed.discovered.topic).toBe('multi-agent orchestration');
      expect(parsed.added).toHaveLength(1);
    });
  });

  describe('text format', () => {
    it('returns concise summary', () => {
      const text = generateDigest(MOCK_RESULT, { format: 'text' });
      expect(text).toContain('Found 4 papers');
      expect(text).toContain('New: 3');
      expect(text).toContain('Added: 1');
    });
  });
});
