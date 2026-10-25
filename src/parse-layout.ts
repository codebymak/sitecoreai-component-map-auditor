import fs from 'node:fs';
import path from 'node:path';
import type { UsedRendering } from './types.js';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldNames(fields: unknown): string[] | undefined {
  if (!isRecord(fields)) return undefined;
  return Object.keys(fields);
}

/**
 * Walk a Sitecore layout / route JSON tree and collect componentName usages.
 * Accepts either a full GraphQL layout envelope or a bare `{ sitecore: { route } }`
 * object as documented in SitecoreAI layout query responses.
 */
export function parseLayoutFile(filePath: string): UsedRendering[] {
  const absolute = path.resolve(filePath);
  const raw = JSON.parse(fs.readFileSync(absolute, 'utf8')) as unknown;
  return parseLayoutData(raw);
}

export function parseLayoutData(raw: unknown): UsedRendering[] {
  const used: UsedRendering[] = [];
  const sitecore = locateSitecore(raw);
  if (!sitecore) return used;

  const route = isRecord(sitecore.route) ? sitecore.route : undefined;
  if (!route) return used;

  const placeholders = route.placeholders;
  walkPlaceholders(placeholders, 'sitecore.route.placeholders', used);
  return used;
}

function locateSitecore(raw: unknown): UnknownRecord | undefined {
  if (!isRecord(raw)) return undefined;
  if (isRecord(raw.sitecore)) return raw.sitecore;

  // GraphQL envelope: data.layout.item.rendered.sitecore
  const data = isRecord(raw.data) ? raw.data : undefined;
  const layout = data && isRecord(data.layout) ? data.layout : undefined;
  const item = layout && isRecord(layout.item) ? layout.item : undefined;
  const rendered =
    item && isRecord(item.rendered) ? item.rendered : undefined;
  if (rendered && isRecord(rendered.sitecore)) return rendered.sitecore;

  return undefined;
}

function walkPlaceholders(
  placeholders: unknown,
  basePath: string,
  out: UsedRendering[]
): void {
  if (!isRecord(placeholders)) return;

  for (const [phKey, components] of Object.entries(placeholders)) {
    if (!Array.isArray(components)) continue;
    components.forEach((component, index) => {
      if (!isRecord(component)) return;
      const name =
        typeof component.componentName === 'string'
          ? component.componentName
          : undefined;
      const here = `${basePath}.${phKey}[${index}]`;
      if (name) {
        out.push({
          componentName: name,
          path: here,
          fields: fieldNames(component.fields),
        });
      }
      if (component.placeholders) {
        walkPlaceholders(component.placeholders, `${here}.placeholders`, out);
      }
    });
  }
}
