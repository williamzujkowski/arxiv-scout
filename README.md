# arxiv-scout

Research paper discovery pipeline for [nexus-agents](https://github.com/williamzujkowski/nexus-agents). Exercises all 5 `research_*` MCP tools.

## Pipeline

```
research_discover → research_add → research_query → research_analyze → research_catalog_review
```

## Quick start

```bash
pnpm install
pnpm test        # Run unit tests
pnpm lint        # TypeScript strict check
pnpm build       # Compile to dist/
```

## MCP tools covered

| Tool | Purpose |
|------|---------|
| `research_discover` | Find papers from arXiv, GitHub, Semantic Scholar |
| `research_add` | Add papers to the research registry |
| `research_query` | Query registry for status, overlaps, stats |
| `research_analyze` | Analyze registry for gaps, trends, priorities |
| `research_catalog_review` | Review auto-cataloged references |

## Live integration mode

```bash
NEXUS_LIVE=true SCOUT_TOPIC="LLM routing" npx tsx src/run-live.ts
```

## License

MIT
