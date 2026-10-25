import fs from 'node:fs';
import path from 'node:path';
import type { UsedRendering } from './types.js';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse a lightweight agentic-workflow fixture that lists renderings an agent
 * may place. Supported shapes (all public, file-based — no private APIs):
 *
 * 1. `{ "renderings": ["Hero", "Promo"] }`
 * 2. `{ "steps": [{ "componentName": "Hero" }, ...] }`
 * 3. `{ "plannedComponents": [{ "name": "Hero", "fields": {...} }] }`
 */
export function parseWorkflowFile(filePath: string): UsedRendering[] {
  const absolute = path.resolve(filePath);
  const raw = JSON.parse(fs.readFileSync(absolute, 'utf8')) as unknown;
  return parseWorkflowData(raw, path.basename(absolute));
}

export function parseWorkflowData(
  raw: unknown,
  label = 'workflow'
): UsedRendering[] {
  const used: UsedRendering[] = [];
  if (!isRecord(raw)) return used;

  if (Array.isArray(raw.renderings)) {
    raw.renderings.forEach((name, i) => {
      if (typeof name === 'string') {
        used.push({
          componentName: name,
          path: `${label}.renderings[${i}]`,
        });
      }
    });
  }

  if (Array.isArray(raw.steps)) {
    raw.steps.forEach((step, i) => {
      if (!isRecord(step)) return;
      const name =
        typeof step.componentName === 'string'
          ? step.componentName
          : typeof step.rendering === 'string'
            ? step.rendering
            : undefined;
      if (name) {
        used.push({
          componentName: name,
          path: `${label}.steps[${i}]`,
          fields: isRecord(step.fields) ? Object.keys(step.fields) : undefined,
        });
      }
    });
  }

  if (Array.isArray(raw.plannedComponents)) {
    raw.plannedComponents.forEach((comp, i) => {
      if (!isRecord(comp)) return;
      const name =
        typeof comp.name === 'string'
          ? comp.name
          : typeof comp.componentName === 'string'
            ? comp.componentName
            : undefined;
      if (name) {
        used.push({
          componentName: name,
          path: `${label}.plannedComponents[${i}]`,
          fields: isRecord(comp.fields) ? Object.keys(comp.fields) : undefined,
        });
      }
    });
  }

  return used;
}
