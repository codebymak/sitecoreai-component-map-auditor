# Marketplace shell (optional)

This folder is a **placeholder** for an XM Cloud / SitecoreAI Marketplace app that surfaces the Component Map Auditor inside the Cloud Portal.

## Intended extension points

- **Page context panel** — author has a page open; the panel runs the auditor against that page’s layout JSON (when your app is granted the documented Marketplace / Authoring read scopes you choose).
- **Full-screen / standalone** — paste layout JSON or point at a workflow fixture; show findings with the same codes as the CLI.

## What ships today

The product of record is the **CLI** in the repository root. Do not pretend this folder is a finished Marketplace submission.

Suggested next steps for submission:

1. Scaffold a Next.js app with `@sitecore-marketplace-sdk/client`.
2. Call the auditor library (`import { audit, parseLayoutData, ... } from 'sitecoreai-component-map-auditor'`).
3. Register the app in Cloud Portal → App studio with a real deployment URL (never leave `localhost` for authors).
4. Capture screenshots into `../docs/screenshots/` for the listing.

API access should stay minimal: prefer fixture upload / layout JSON the author pastes over broad Authoring API grants until a permission review says otherwise.
