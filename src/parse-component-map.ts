import fs from 'node:fs';
import path from 'node:path';
import type { MapEntry } from './types.js';

/**
 * Parse a Content SDK `.sitecore/component-map.ts` (or `.client.ts`) file.
 *
 * Uses the documented public shape: `new Map<string, ...>([['Name', value], ...])`
 * with optional `{ ...Component, componentType: 'client' }` entries.
 * Does not execute the module or invent Sitecore private APIs.
 */
export function parseComponentMapFile(
  filePath: string,
  source: MapEntry['source']
): MapEntry[] {
  const absolute = path.resolve(filePath);
  const text = fs.readFileSync(absolute, 'utf8');
  return parseComponentMapSource(text, source);
}

export function parseComponentMapSource(
  text: string,
  source: MapEntry['source']
): MapEntry[] {
  const entries: MapEntry[] = [];
  const seen = new Set<string>();

  // Match map tuple entries: ['ComponentName', <expr>]
  // Handles both string keys and simple identifiers used as first tuple members.
  const tupleRe =
    /\[\s*['"]([A-Za-z_][\w]*)['"]\s*,\s*([\s\S]*?)\s*\]\s*(?:,|\])/g;

  let match: RegExpExecArray | null;
  while ((match = tupleRe.exec(text)) !== null) {
    const name = match[1];
    const expr = match[2].trim();
    if (seen.has(name)) continue;
    seen.add(name);

    const typeMatch = expr.match(
      /componentType\s*:\s*['"](server|client|universal)['"]/
    );
    entries.push({
      name,
      componentType: typeMatch
        ? (typeMatch[1] as MapEntry['componentType'])
        : undefined,
      source,
    });
  }

  return entries;
}

/** Built-in Content SDK map keys commonly expected in starters. */
export const DOCUMENTED_BUILTINS = [
  'BYOCWrapper',
  'FEaaSWrapper',
  'Form',
] as const;
