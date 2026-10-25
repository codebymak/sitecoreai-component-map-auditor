import { describe, expect, it } from 'vitest';
import { audit } from './audit.js';
import { parseComponentMapSource } from './parse-component-map.js';
import { parseLayoutData } from './parse-layout.js';
import { parseWorkflowData } from './parse-workflow.js';
import { loadContractsData } from './contracts.js';

const mapSource = `
export const componentMap = new Map([
  ['BYOCWrapper', BYOC],
  ['FEaaSWrapper', FEaaS],
  ['Form', { ...Form, componentType: 'client' }],
  ['Hero', Hero],
  ['Promo', Promo],
  ['ServerOnlyNav', { ...ServerOnlyNav, componentType: 'server' }],
]);
`;

const clientSource = `
export const componentMap = new Map([
  ['Form', Form],
  ['Hero', Hero],
  ['Promo', Promo],
]);
`;

describe('parseComponentMapSource', () => {
  it('extracts names and componentType', () => {
    const entries = parseComponentMapSource(mapSource, 'server-map');
    expect(entries.map((e) => e.name)).toEqual([
      'BYOCWrapper',
      'FEaaSWrapper',
      'Form',
      'Hero',
      'Promo',
      'ServerOnlyNav',
    ]);
    expect(entries.find((e) => e.name === 'Form')?.componentType).toBe('client');
    expect(entries.find((e) => e.name === 'ServerOnlyNav')?.componentType).toBe(
      'server'
    );
  });
});

describe('audit', () => {
  it('flags unknown renderings and missing required fields', () => {
    const serverMap = parseComponentMapSource(mapSource, 'server-map');
    const clientMap = parseComponentMapSource(clientSource, 'client-map');
    const used = parseLayoutData({
      sitecore: {
        route: {
          placeholders: {
            'headless-main': [
              {
                componentName: 'Hero',
                fields: { heading: { value: 'Hi' } },
              },
              { componentName: 'GhostCard', fields: {} },
              {
                componentName: 'ServerOnlyNav',
                fields: { items: { value: '[]' } },
              },
            ],
          },
        },
      },
    });
    const contracts = loadContractsData({
      Hero: { requiredFields: ['heading', 'summary'] },
      ServerOnlyNav: { requiredFields: ['items'] },
    });

    const report = audit({
      serverMap,
      clientMap,
      used,
      contracts,
      pitfallHits: [],
    });

    expect(report.ok).toBe(false);
    expect(
      report.findings.some(
        (f) => f.code === 'unknown-rendering' && f.componentName === 'GhostCard'
      )
    ).toBe(true);
    expect(
      report.findings.some(
        (f) =>
          f.code === 'missing-required-field' &&
          f.componentName === 'Hero' &&
          f.message.includes('summary')
      )
    ).toBe(true);
    expect(
      report.findings.some(
        (f) =>
          f.code === 'missing-from-client-map' &&
          f.componentName === 'ServerOnlyNav'
      )
    ).toBe(true);
  });

  it('parses workflow planned components', () => {
    const used = parseWorkflowData({
      plannedComponents: [{ name: 'SparkleBanner' }, { name: 'Hero' }],
    });
    expect(used.map((u) => u.componentName)).toEqual([
      'SparkleBanner',
      'Hero',
    ]);
  });
});
