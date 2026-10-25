#!/usr/bin/env node
import { Command } from 'commander';
import { audit } from './audit.js';
import { loadContractsFile } from './contracts.js';
import { parseComponentMapFile } from './parse-component-map.js';
import { parseLayoutFile } from './parse-layout.js';
import { parseWorkflowFile } from './parse-workflow.js';
import { scanPitfalls } from './pitfalls.js';
import { formatJsonReport, formatTextReport } from './report.js';
import type { UsedRendering } from './types.js';

const program = new Command();

program
  .name('scai-cmap-audit')
  .description(
    'Validate that layout JSON / agentic workflow rendering names exist in the Sitecore Content SDK component map.'
  )
  .requiredOption(
    '-m, --map <file>',
    'Path to .sitecore/component-map.ts (server / full map)'
  )
  .option(
    '-c, --client-map <file>',
    'Path to .sitecore/component-map.client.ts (App Router client map)'
  )
  .option('-l, --layout <file>', 'Path to layout / route JSON fixture')
  .option(
    '-w, --workflow <file>',
    'Path to agentic workflow JSON listing planned renderings'
  )
  .option(
    '--contracts <file>',
    'Optional JSON map of componentName → requiredFields'
  )
  .option(
    '--scan <dir>',
    'Scan a source tree for common JSS → Content SDK migration pitfalls'
  )
  .option('--json', 'Emit JSON report instead of text', false)
  .option(
    '--fail-on <level>',
    'Exit non-zero on error (default) or warning',
    'error'
  )
  .action((opts) => {
    const serverMap = parseComponentMapFile(opts.map, 'server-map');
    const clientMap = opts.clientMap
      ? parseComponentMapFile(opts.clientMap, 'client-map')
      : [];

    const used: UsedRendering[] = [];
    if (opts.layout) used.push(...parseLayoutFile(opts.layout));
    if (opts.workflow) used.push(...parseWorkflowFile(opts.workflow));

    if (!opts.layout && !opts.workflow && !opts.scan) {
      console.error(
        'Provide at least one of --layout, --workflow, or --scan so there is something to audit.'
      );
      process.exit(2);
    }

    const contracts = opts.contracts ? loadContractsFile(opts.contracts) : {};
    const pitfallHits = opts.scan ? scanPitfalls(opts.scan) : [];

    const report = audit({
      serverMap,
      clientMap,
      used,
      contracts,
      pitfallHits,
    });

    const output = opts.json
      ? formatJsonReport(report)
      : formatTextReport(report);
    console.log(output);

    const failOnWarning = opts.failOn === 'warning';
    if (!report.ok || (failOnWarning && report.summary.warnings > 0)) {
      process.exit(1);
    }
  });

program.parse();
