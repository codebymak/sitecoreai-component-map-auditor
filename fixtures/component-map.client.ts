// Sample client component map — client + universal only.

import type { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';

declare const Form: unknown;
declare const Title: unknown;
declare const Hero: unknown;
declare const Promo: unknown;

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['Form', Form],
  ['Title', Title],
  ['Hero', Hero],
  ['Promo', Promo],
]);

export default componentMap;
