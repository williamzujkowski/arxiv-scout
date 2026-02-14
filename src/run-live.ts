#!/usr/bin/env tsx
/**
 * Run the scout pipeline against a live nexus-agents MCP server.
 *
 * Usage: NEXUS_LIVE=true npx tsx src/run-live.ts
 */

import { runScoutPipeline } from './scout-pipeline.js';
import { generateDigest } from './digest.js';
import { isLiveMode } from './live-caller.js';
import type { ToolCaller } from './scout-pipeline.js';

async function main(): Promise<void> {
  if (!isLiveMode()) {
    console.error('Set NEXUS_LIVE=true to run against a live MCP server.');
    process.exit(1);
  }

  let caller: ToolCaller;
  try {
    const bridgePath = './live-bridge.js';
    const mod: Record<string, unknown> = await import(bridgePath);
    const factory = mod['createMcpCaller'] as (() => Promise<ToolCaller>) | undefined;
    if (typeof factory !== 'function') throw new Error('live-bridge.ts must export createMcpCaller()');
    caller = await factory();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to load live bridge: ${msg}`);
    process.exit(1);
  }

  const topic = process.env['SCOUT_TOPIC'] ?? 'multi-agent orchestration';
  console.log(`Scouting papers on: ${topic}\n`);

  const result = await runScoutPipeline(caller, { topic, maxResults: 5 });
  const format = (process.env['REPORT_FORMAT'] ?? 'text') as 'markdown' | 'json' | 'text';
  console.log(generateDigest(result, { format }));
}

void main();
