# SitecoreAI Component Map Auditor

A small, honest developer tool for **SitecoreAI / XM Cloud** teams using the **Sitecore Content SDK**.

Agentic workflows and layout JSON can name renderings that never appear in `.sitecore/component-map.ts`. The failure mode is nasty: local `next dev` may look fine after a generate-map watch, while production or a page-builder session shows **unknown component** for anything the map missed. This CLI catches that **before** publish.

It only reads **public, documented shapes**:

- Content SDK component maps (`new Map([['Name', Component], ...])`, optional `componentType`)
- Layout / route JSON (`sitecore.route.placeholders[].componentName`)
- Simple agentic workflow fixtures that list planned rendering names
- Optional field-contract JSON you maintain next to your components

No private Sitecore APIs. No fake telemetry.

## Why it helps SitecoreAI teams

| Problem | What the auditor does |
| --- | --- |
| Agent invents `SparkleBanner` | Flags `unknown-rendering` against the real component map |
| App Router client `AppPlaceholder` gets a server-only map entry | Flags `missing-from-client-map` when a client map is supplied |
| Datasource missing a field the React component requires | Flags `missing-required-field` when you pass `--contracts` |
| JSS leftovers (`temp/componentBuilder`, `field.editable`, …) | Flags `jss-leftover` via `--scan` |

This is the same class of bug described in Ali Khan’s Content SDK migration writing on [alikhan.tech](https://alikhan.tech): the map is a build artifact, and an agent that writes layout without reading it will succeed as a workflow while the site goes blank.

## Install

```bash
git clone https://github.com/codebymak/sitecoreai-component-map-auditor.git
cd sitecoreai-component-map-auditor
npm install
npm run build
npm test
```

Optional global link:

```bash
npm link
scai-cmap-audit --help
```

## Run against the sample fixtures

```bash
npm run build
npm run audit:fixtures
```

Or explicitly:

```bash
node dist/cli.js \
  --map fixtures/component-map.ts \
  --client-map fixtures/component-map.client.ts \
  --layout fixtures/layout-home.json \
  --workflow fixtures/agentic-workflow.json \
  --contracts fixtures/field-contracts.json \
  --scan fixtures/pitfalls-sample
```

Expect a **FAIL** on the fixtures: they intentionally include `UnknownAgentCard`, `SparkleBanner`, a Promo missing `ctaLabel`, a server-only nav on a dual-map setup, and JSS leftovers.

## Run against your Content SDK app

```bash
npx scai-cmap-audit \
  --map path/to/your-app/.sitecore/component-map.ts \
  --client-map path/to/your-app/.sitecore/component-map.client.ts \
  --layout ./fixtures/exported-home.json \
  --contracts ./contracts/fields.json \
  --scan path/to/your-app/src \
  --fail-on error
```

Tips:

1. Export layout JSON from a layout query / Experience Edge response, or keep checked-in fixtures for critical templates.
2. Keep `contracts/*.json` next to the component that owns the field TypeScript type.
3. Add the CLI to CI after `sitecore-tools:generate-map` so the map under audit is the one you ship.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | No errors (warnings allowed unless `--fail-on warning`) |
| `1` | One or more errors (or warnings when `--fail-on warning`) |
| `2` | Usage / missing inputs |

### JSON output

```bash
node dist/cli.js --map fixtures/component-map.ts --layout fixtures/layout-home.json --json
```

## Optional Marketplace-shaped app

See [`marketplace-app/README.md`](./marketplace-app/README.md) for a thin Next.js shell that can later host this auditor as an XM Cloud Marketplace **page context panel** or **full-screen** tool. The CLI is the product today; the app folder is the submission-shaped wrapper.

Screenshots for Marketplace listing can live under `docs/screenshots/` once you run the CLI locally and capture the terminal / panel UI.

## Blog draft

A post ready for [ali-khan-blog](https://github.com/codebymak/ali-khan-blog) is at:

`docs/blog-sitecoreai-component-map-auditor.md`

Suggested path on the blog repo: `content/blogs/2026/sitecoreai-component-map-auditor.md` (date **2026-11-12**, after the Oct 25–Nov 11 series).

## License

MIT — see [LICENSE](./LICENSE).

## Credits

Built for real SitecoreAI / Content SDK workflows. Component map and layout shapes follow Sitecore’s public Content SDK and layout-query documentation.
