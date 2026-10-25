import fs from 'node:fs';
import path from 'node:path';
import type { Finding } from './types.js';

const PATTERNS: Array<{
  re: RegExp;
  code: Finding['code'];
  severity: Finding['severity'];
  message: string;
  hint: string;
}> = [
  {
    re: /temp\/componentBuilder|componentFactory\b/,
    code: 'jss-leftover',
    severity: 'error',
    message:
      'JSS componentFactory / temp/componentBuilder reference found. Content SDK uses .sitecore/component-map instead.',
    hint: 'Import the generated Map from .sitecore/component-map and pass it to SitecoreProvider / AppPlaceholder.',
  },
  {
    re: /field\.editable\b/,
    code: 'jss-leftover',
    severity: 'error',
    message:
      'field.editable usage found. Content SDK / SitecoreAI page builder uses field.metadata, not Experience Editor editable HTML.',
    hint: 'Use Content SDK field helpers (Text, RichText, Image) and page.mode.isEditing when you need mode checks.',
  },
  {
    re: /\bExperienceEditor\b|\bEditFrame\b|EditMode\.Chromes/,
    code: 'jss-leftover',
    severity: 'error',
    message:
      'Experience Editor / EditFrame / EditMode.Chromes leftover found. Content SDK does not support Experience Editor.',
    hint: 'Remove EE-only chrome; visual editing goes through the SitecoreAI page builder.',
  },
  {
    re: /\bSITECORE_API_KEY\b|\bJSS_EDITING_SECRET\b|\bSITECORE_SITE_NAME\b/,
    code: 'jss-leftover',
    severity: 'warning',
    message:
      'Legacy JSS environment variable name found. Content SDK renames several SITECORE_* / JSS_* vars.',
    hint: 'See the Content SDK upgrade guide: NEXT_PUBLIC_SITECORE_API_KEY, SITECORE_EDITING_SECRET, NEXT_PUBLIC_DEFAULT_SITE_NAME, etc.',
  },
  {
    re: /\buseSitecoreContext\b|\bSitecoreContext\b/,
    code: 'jss-leftover',
    severity: 'warning',
    message:
      'JSS SitecoreContext / useSitecoreContext reference found. Content SDK uses SitecoreProvider and useSitecore().',
    hint: 'Migrate context reads to the Page object and useSitecore() from @sitecore-content-sdk/nextjs.',
  },
];

/**
 * Scan source files under a directory for common Content SDK migration pitfalls
 * documented in Sitecore's public upgrade guides and community write-ups.
 */
export function scanPitfalls(rootDir: string): Finding[] {
  const absolute = path.resolve(rootDir);
  if (!fs.existsSync(absolute)) return [];

  const findings: Finding[] = [];
  const files = listSourceFiles(absolute);

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(absolute, file);
    for (const pattern of PATTERNS) {
      if (pattern.re.test(text)) {
        findings.push({
          code: pattern.code,
          severity: pattern.severity,
          message: pattern.message,
          path: rel,
          hint: pattern.hint,
        });
      }
    }
  }

  return findings;
}

function listSourceFiles(root: string): string[] {
  const out: string[] = [];
  const skip = new Set(['node_modules', 'dist', '.git', '.next', 'coverage']);

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
        out.push(full);
      }
    }
  }

  walk(root);
  return out;
}
