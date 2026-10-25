import {
  DOCUMENTED_BUILTINS,
} from './parse-component-map.js';
import type {
  AuditInput,
  AuditReport,
  Finding,
  MapEntry,
} from './types.js';

/**
 * Core auditor: compare used rendering names to Content SDK component maps,
 * optional field contracts, and precomputed pitfall hits.
 */
export function audit(input: AuditInput): AuditReport {
  const findings: Finding[] = [...input.pitfallHits];
  const serverNames = new Set(input.serverMap.map((e) => e.name));
  const clientNames = new Set(input.clientMap.map((e) => e.name));
  const serverByName = indexByName(input.serverMap);

  if (input.serverMap.length === 0) {
    findings.push({
      code: 'map-parse-empty',
      severity: 'error',
      message:
        'Server component map parsed to zero entries. Expected Map tuples like [\'Title\', Title].',
      hint: 'Pass the generated .sitecore/component-map.ts from a Content SDK app, or use the sample under fixtures/.',
    });
  }

  for (const builtin of DOCUMENTED_BUILTINS) {
    if (input.serverMap.length > 0 && !serverNames.has(builtin)) {
      findings.push({
        code: 'builtin-missing',
        severity: 'info',
        componentName: builtin,
        message: `Documented Content SDK built-in "${builtin}" is not in the server component map.`,
        hint: 'Starters usually register BYOCWrapper, FEaaSWrapper, and Form from @sitecore-content-sdk/nextjs. Confirm intentional omission before ignoring.',
      });
    }
  }

  const seenUnknown = new Set<string>();

  for (const usage of input.used) {
    const name = usage.componentName;

    if (!serverNames.has(name)) {
      if (!seenUnknown.has(name)) {
        seenUnknown.add(name);
        findings.push({
          code: 'unknown-rendering',
          severity: 'error',
          componentName: name,
          path: usage.path,
          message: `Rendering "${name}" is used but not registered in the Content SDK component map.`,
          hint: 'Register the component in the map (or ensure sitecore-tools:generate-map includes its folder). Agentic workflows that invent names will fail at runtime with an unknown component.',
        });
      }
      continue;
    }

    const entry = serverByName.get(name);
    const isServerOnly =
      entry?.componentType === 'server' ||
      (input.clientMap.length > 0 &&
        !clientNames.has(name) &&
        entry?.componentType !== 'universal' &&
        entry?.componentType !== 'client');

    // Only flag client-map gaps when a client map was supplied and the entry
    // is explicitly server-typed, or missing from the client map while dual maps exist.
    if (
      input.clientMap.length > 0 &&
      !clientNames.has(name) &&
      (entry?.componentType === 'server' || isServerOnly)
    ) {
      findings.push({
        code: 'missing-from-client-map',
        severity: 'warning',
        componentName: name,
        path: usage.path,
        message: `Rendering "${name}" is on the server map but not on the client map.`,
        hint: 'App Router client components must import .sitecore/component-map.client.ts. Server-only components cannot be resolved inside a client AppPlaceholder.',
      });
    }

    const contract = input.contracts[name];
    if (!contract) {
      // Missing contract is informational unless the team opted into contracts.
      if (Object.keys(input.contracts).length > 0) {
        findings.push({
          code: 'missing-field-contract',
          severity: 'warning',
          componentName: name,
          path: usage.path,
          message: `No field contract defined for "${name}".`,
          hint: 'Add requiredFields for this component in the contracts JSON so agentic writers and imports cannot omit required datasource fields.',
        });
      }
      continue;
    }

    if (usage.fields) {
      for (const required of contract.requiredFields) {
        if (!usage.fields.includes(required)) {
          findings.push({
            code: 'missing-required-field',
            severity: 'error',
            componentName: name,
            path: usage.path,
            message: `Component "${name}" is missing required field "${required}".`,
            hint: 'Align the datasource / agent payload with the component field contract before publish.',
          });
        }
      }
    }
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;
  const uniqueUsed = new Set(input.used.map((u) => u.componentName)).size;

  return {
    ok: errors === 0,
    summary: {
      mapEntries: input.serverMap.length,
      clientMapEntries: input.clientMap.length,
      usedRenderings: input.used.length,
      uniqueUsed,
      errors,
      warnings,
      infos,
    },
    findings,
  };
}

function indexByName(entries: MapEntry[]): Map<string, MapEntry> {
  const map = new Map<string, MapEntry>();
  for (const entry of entries) map.set(entry.name, entry);
  return map;
}
