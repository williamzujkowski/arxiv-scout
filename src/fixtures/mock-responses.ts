/**
 * Mock MCP tool responses for deterministic testing.
 *
 * These fixtures match the exact shapes returned by nexus-agents
 * research_* MCP tools.
 */

import type {
  DiscoverResponse,
  AddResponse,
  QueryResponse,
  AnalyzeResponse,
  CatalogReviewResponse,
} from '../types.js';

export const MOCK_DISCOVER_RESPONSE: DiscoverResponse = {
  topic: 'multi-agent orchestration',
  sourcesQueried: ['arxiv', 'semantic_scholar'],
  failedSources: [],
  items: [
    {
      source: 'arxiv',
      title: 'Adaptive Multi-Agent Task Routing with Bandit Feedback',
      url: 'https://arxiv.org/abs/2501.12345',
      description: 'A novel approach to routing tasks across heterogeneous agents.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13T12:00:00Z',
      relevanceScore: 0.92,
    },
    {
      source: 'arxiv',
      title: 'MemR3: Reflective Memory for Retrieval-Augmented Generation',
      url: 'https://arxiv.org/abs/2512.20237',
      description: 'Memory retrieval enhancement via LLM reflection.',
      alreadyInRegistry: true,
      discoveredAt: '2026-02-13T12:00:00Z',
      relevanceScore: 0.85,
    },
    {
      source: 'semantic_scholar',
      title: 'Consensus Protocols for Multi-Model AI Systems',
      url: 'https://arxiv.org/abs/2502.00789',
      description: 'Voting mechanisms for multi-agent decision-making.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13T12:00:00Z',
      relevanceScore: 0.78,
    },
    {
      source: 'arxiv',
      title: 'Non-arXiv Paper on Agent Routing',
      url: 'https://example.com/paper/no-arxiv-id',
      description: 'A paper without an arXiv ID.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13T12:00:00Z',
    },
  ],
  totalFound: 4,
  alreadyInRegistry: 1,
  newItems: 3,
};

export const MOCK_ADD_RESPONSE_SUCCESS: AddResponse = {
  success: true,
  paperId: 'arxiv-2501.12345',
  title: 'Adaptive Multi-Agent Task Routing with Bandit Feedback',
  message: 'Paper added to registry under topic: multi-agent orchestration',
  dryRun: false,
};

export const MOCK_ADD_RESPONSE_DUPLICATE: AddResponse = {
  success: false,
  paperId: 'arxiv-2512.20237',
  title: '',
  message: 'Paper already exists in registry',
  dryRun: false,
};

export const MOCK_QUERY_STATS_RESPONSE: QueryResponse = {
  action: 'stats',
  success: true,
  data: {
    totalPapers: 15,
    totalTechniques: 8,
    byStatus: {
      implemented: 3,
      planned: 2,
      'not-started': 3,
    },
    byTopic: {
      'multi-agent orchestration': 5,
      'memory retrieval': 3,
      routing: 4,
      consensus: 3,
    },
  },
};

export const MOCK_QUERY_SEARCH_RESPONSE: QueryResponse = {
  action: 'search',
  success: true,
  data: {
    query: 'bandit routing',
    matches: [
      { id: 'arxiv-2501.12345', title: 'Adaptive Multi-Agent Task Routing' },
    ],
    matchCount: 1,
  },
};

export const MOCK_ANALYZE_GAPS_RESPONSE: AnalyzeResponse = {
  focus: 'gaps',
  success: true,
  analysis: {
    techniquesWithoutPapers: ['latency-aware-scheduling'],
    underResearchedTopics: ['security-hardening'],
  },
  recommendations: [
    'Add papers on latency-aware scheduling for orchestration',
    'Research security hardening techniques for multi-agent systems',
  ],
};

export const MOCK_ANALYZE_COVERAGE_RESPONSE: AnalyzeResponse = {
  focus: 'coverage',
  success: true,
  analysis: {
    total: 8,
    implemented: 3,
    planned: 2,
    notStarted: 3,
    implementationRate: 0.375,
  },
  recommendations: [
    'Consider prioritizing planned techniques for implementation',
    'Review not-started techniques for relevance',
  ],
};

export const MOCK_CATALOG_LIST_RESPONSE: CatalogReviewResponse = {
  action: 'list',
  success: true,
  message: '2 pending references awaiting review',
  data: {
    pending: [
      { identifier: '2503.00111', source: 'auto-catalog', title: 'Auto-discovered Paper 1' },
      { identifier: '2503.00222', source: 'auto-catalog', title: 'Auto-discovered Paper 2' },
    ],
    count: 2,
  },
};

export const MOCK_CATALOG_FLUSH_RESPONSE: CatalogReviewResponse = {
  action: 'flush',
  success: true,
  message: 'Cleared all pending references',
};

/** Error response for testing failure paths. */
export const MOCK_DISCOVER_ERROR: DiscoverResponse = {
  topic: 'invalid-topic-that-returns-nothing',
  sourcesQueried: ['arxiv'],
  failedSources: ['semantic_scholar', 'openalex'],
  items: [],
  totalFound: 0,
  alreadyInRegistry: 0,
  newItems: 0,
};
