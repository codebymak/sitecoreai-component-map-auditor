import fs from 'node:fs';
import path from 'node:path';
import type { FieldContract } from './types.js';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Load optional field contracts:
 * `{ "Hero": { "requiredFields": ["heading", "summary"] } }`
 */
export function loadContractsFile(
  filePath: string
): Record<string, FieldContract> {
  const absolute = path.resolve(filePath);
  const raw = JSON.parse(fs.readFileSync(absolute, 'utf8')) as unknown;
  return loadContractsData(raw);
}

export function loadContractsData(
  raw: unknown
): Record<string, FieldContract> {
  const out: Record<string, FieldContract> = {};
  if (!isRecord(raw)) return out;

  for (const [name, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const required = Array.isArray(value.requiredFields)
      ? value.requiredFields.filter((f): f is string => typeof f === 'string')
      : [];
    out[name] = { requiredFields: required };
  }
  return out;
}
