---
title: SitecoreAI Component Map Auditor — Catching Unknown Renderings Before Publish
date: 2026-11-12T03:00:00+00:00
image: /images/post/component-map-auditor.png
categories: ["Sitecore", "SitecoreAI", "Content SDK", "Marketplace", "Open Source"]
featured: false
draft: false
---

The first time an agentic flow wrote a homepage for us, the workflow UI showed green. Every step had a checkmark. The layout JSON looked like layout JSON. The page builder opened a blank main placeholder where the hero should have been, and the browser console said the quiet part out loud: the rendering name was not in the component map.

That is not an AI mystery. It is the same Content SDK rule we already hit during the JSS migration. The map under `.sitecore/component-map` is a build artifact. A component file that exists on disk and is never registered will not render. An agent that invents `SparkleBanner` because the prompt said "make it sparkle" has the same failure mode as a human who forgot to run `sitecore-tools:generate-map` in CI.

I got tired of discovering that in the page builder, so I shipped a small open-source CLI: **SitecoreAI Component Map Auditor**. The repository is public under [codebymak/sitecoreai-component-map-auditor](https://github.com/codebymak/sitecoreai-component-map-auditor). This post is what it does, what it refuses to pretend to do, and how it fits a later Marketplace submission without turning the first release into vaporware.

-----

## The honest problem

Sitecore's Content SDK docs are clear about the map. Starters generate `.sitecore/component-map.ts`, and App Router apps often generate a second `.sitecore/component-map.client.ts` so client `AppPlaceholder` instances do not pull server-only modules into the browser. Registration looks like this public shape:

```ts
export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['Hero', Hero],
]);
```

Layout responses are equally public. Each placed rendering carries `componentName`, nested under `sitecore.route.placeholders`, optionally with its own `placeholders` for structural components. The head looks up `componentName` in the map. There is no fuzzy match. There is no "close enough."

Agentic Studio and any home-grown agent that can write fields or compose layout will happily emit a name that marketers asked for in natural language. The agent run succeeds. The site does not. That gap is the product.

I also keep field contracts next to components: the TypeScript type the React tree can actually render. A Promo that requires `title` and `ctaLabel` should fail the same audit when an import or an agent omits `ctaLabel`. That is the same discipline I used for the governed link custom field in the Marketplace round-two post. Findings and stored values are different extension points. Unknown renderings are a finding against the map. Missing fields are a finding against a contract you own.

-----

## What the auditor checks

The CLI is deliberately narrow.

1. **Unknown rendering** — a `componentName` from layout JSON or a workflow fixture is not a key in the server component map.
2. **Missing from client map** — when you pass the App Router client map, a server-typed (or server-only) entry used in layout is absent from the client map. That matches Sitecore's guidance that client `AppPlaceholder` must import `component-map.client.ts`.
3. **Missing field contract / required field** — optional JSON you maintain: `{ "Hero": { "requiredFields": ["heading", "summary"] } }`. If contracts are provided, used components without a contract warn; present field bags that omit a required name error.
4. **JSS leftovers** — a directory scan for `temp/componentBuilder`, `componentFactory`, `field.editable`, Experience Editor chrome, legacy env var names, and `useSitecoreContext`. Those are the migration pitfalls that already burned us; the scanner only looks for strings that mean you are still on the old SDK mental model.

It does **not** call APIs Sitecore has not documented for this purpose. It does not scrape the page builder. It does not invent telemetry. You point it at files you already have: the generated map, an exported layout fixture, a workflow plan, your source tree.

```bash
npx scai-cmap-audit \
  --map .sitecore/component-map.ts \
  --client-map .sitecore/component-map.client.ts \
  --layout ./fixtures/home.json \
  --workflow ./fixtures/agent-plan.json \
  --contracts ./contracts/fields.json \
  --scan ./src
```

The sample fixtures in the repo are designed to **fail**. That is intentional. A demo that only passes teaches nothing about the failure mode authors and agents actually hit.

-----

## Where it belongs in the pipeline

Run generate-map, then audit, then `next build`. The order matters for the same reason it mattered in the migration guide: auditing a stale map is how you get a green CI and a blank iframe.

I treat critical templates as fixtures. Export the layout JSON for home, product, and article once they stabilize, commit them, and let the auditor fail the pull request when someone renames a rendering in Sitecore without renaming the React registration. That is boring. Boring is how Content SDK apps stay editable.

For agentic flows, the workflow fixture is the plan **before** write. If the plan contains `SparkleBanner` and the map does not, stop. Do not ask the agent to "try again" after publish. The correction belongs in the allow-list of rendering names you expose to the tool, which should be the keys of the same map the head uses.

-----

## Marketplace later, CLI now

I already shipped a page context SEO auditor and a custom field. Round two taught me to pick the extension point from the shape of the data. This tool's natural Marketplace home is a **page context panel** or a **full-screen** paste-the-JSON utility: input is layout or a plan, output is a list of findings. Findings are not a field value. I am not storing audit JSON on the page item.

The repository includes a `marketplace-app/` note describing that shell. It is not a fake listing. The MIT CLI is what you can clone and run today. Screenshots for a future Cloud Portal submission go under `docs/screenshots/` when the panel exists. Shipping the auditor as a library first means the Marketplace UI, when it comes, calls the same `audit()` function CI already uses.

-----

## What I will not claim

I will not claim this replaces Sitecore's own validation. It does not. I will not claim it knows every rendering in your tenant without a map file. It does not talk to private APIs to "discover" components. I will not backdate community impact. The repo is public as of this work; use it, fork it, file issues when a real Content SDK map shape fails to parse.

If your team is writing agentic workflows against SitecoreAI heads, put the component map in the loop. The auditor is one way to make that rule enforceable instead of aspirational.

Repository: [https://github.com/codebymak/sitecoreai-component-map-auditor](https://github.com/codebymak/sitecoreai-component-map-auditor)
