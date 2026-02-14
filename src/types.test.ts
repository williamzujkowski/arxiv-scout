/**
 * Zod schema validation tests
 *
 * Ensures all schemas correctly validate and reject inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  DiscoverInputSchema,
  DiscoverResponseSchema,
  AddInputSchema,
  AddResponseSchema,
  QueryInputSchema,
  AnalyzeInputSchema,
  CatalogReviewInputSchema,
} from './types.js';

describe('DiscoverInputSchema', () => {
  it('accepts valid input', () => {
    const result = DiscoverInputSchema.safeParse({
      topic: 'multi-agent systems',
      source: 'arxiv',
      maxResults: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty topic', () => {
    const result = DiscoverInputSchema.safeParse({ topic: '' });
    expect(result.success).toBe(false);
  });

  it('rejects topic over 200 chars', () => {
    const result = DiscoverInputSchema.safeParse({ topic: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = DiscoverInputSchema.safeParse({
      topic: 'test',
      source: 'invalid_source',
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxResults over 20', () => {
    const result = DiscoverInputSchema.safeParse({
      topic: 'test',
      maxResults: 21,
    });
    expect(result.success).toBe(false);
  });

  it('rejects relevanceThreshold over 1', () => {
    const result = DiscoverInputSchema.safeParse({
      topic: 'test',
      relevanceThreshold: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('AddInputSchema', () => {
  it('accepts valid arXiv ID', () => {
    const result = AddInputSchema.safeParse({ arxivId: '2501.12345' });
    expect(result.success).toBe(true);
  });

  it('accepts 4-digit arXiv ID', () => {
    const result = AddInputSchema.safeParse({ arxivId: '2501.1234' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid arXiv ID format', () => {
    const result = AddInputSchema.safeParse({ arxivId: 'not-an-id' });
    expect(result.success).toBe(false);
  });

  it('rejects missing arxivId', () => {
    const result = AddInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts all priority levels', () => {
    for (const p of ['P1', 'P2', 'P3', 'P4']) {
      const result = AddInputSchema.safeParse({
        arxivId: '2501.12345',
        priority: p,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('QueryInputSchema', () => {
  it('accepts all action types', () => {
    for (const action of ['status', 'overlap', 'stats', 'search']) {
      const result = QueryInputSchema.safeParse({ action });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid action', () => {
    const result = QueryInputSchema.safeParse({ action: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('AnalyzeInputSchema', () => {
  it('accepts all focus types', () => {
    for (const focus of ['gaps', 'trends', 'priorities', 'stale', 'coverage']) {
      const result = AnalyzeInputSchema.safeParse({ focus });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional topic', () => {
    const result = AnalyzeInputSchema.safeParse({
      focus: 'gaps',
      topic: 'routing',
    });
    expect(result.success).toBe(true);
  });
});

describe('CatalogReviewInputSchema', () => {
  it('accepts all action types', () => {
    for (const action of ['list', 'approve', 'dismiss', 'flush']) {
      const result = CatalogReviewInputSchema.safeParse({ action });
      expect(result.success).toBe(true);
    }
  });

  it('accepts approve with identifier and topic', () => {
    const result = CatalogReviewInputSchema.safeParse({
      action: 'approve',
      identifier: '2501.12345',
      topic: 'routing',
    });
    expect(result.success).toBe(true);
  });
});

describe('DiscoverResponseSchema', () => {
  it('rejects response missing required fields', () => {
    const result = DiscoverResponseSchema.safeParse({
      topic: 'test',
      // missing other fields
    });
    expect(result.success).toBe(false);
  });
});

describe('AddResponseSchema', () => {
  it('validates complete response', () => {
    const result = AddResponseSchema.safeParse({
      success: true,
      paperId: 'arxiv-2501.12345',
      title: 'Test Paper',
      message: 'Added',
      dryRun: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing success field', () => {
    const result = AddResponseSchema.safeParse({
      paperId: 'test',
      title: 'Test',
      message: 'msg',
      dryRun: false,
    });
    expect(result.success).toBe(false);
  });
});
