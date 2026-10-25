import React from 'react';

// Deliberate JSS leftovers for the pitfall scanner demo.
export function LegacyHero({ fields }: { fields: { heading: { editable?: string; value?: string } } }) {
  const html = fields.heading.editable || fields.heading.value;
  return <div dangerouslySetInnerHTML={{ __html: String(html) }} />;
}

export { componentFactory } from 'temp/componentBuilder';
