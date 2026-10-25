// Sample Content SDK component map (documented public shape).
// Mirrors Sitecore starter conventions — not executed by the auditor.

import type { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';

declare const BYOCServerWrapper: unknown;
declare const FEaaSServerWrapper: unknown;
declare const Form: { componentType?: string };
declare const Title: unknown;
declare const Hero: unknown;
declare const Promo: unknown;
declare const ServerOnlyNav: { componentType?: string };

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['Title', Title],
  ['Hero', Hero],
  ['Promo', Promo],
  ['ServerOnlyNav', { ...ServerOnlyNav, componentType: 'server' }],
]);

export default componentMap;
