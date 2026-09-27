---
name: publish-page
description: Publish an HTML page (report, chart, dashboard, budget view, anything visual) to the user's private tailnet and reply with a link they can open on their phone or laptop. Use whenever output is better viewed as a web page than as chat text, and prefer it over sending an .html file as an attachment.
---

# Publish a page

Every agent has a private web folder at `/workspace/agent/public/`. The host serves it on the user's Tailscale network (tailnet-only, never the public internet) at:

`<base-url>/<path-inside-public>`

The base URL is in `/workspace/agent/public/.base-url` (e.g. `https://nanoclaw.tail1234.ts.net/claw/dm-with-sam`).

## Steps

1. Read the base URL: `cat /workspace/agent/public/.base-url`.
   If the file is missing, publishing isn't set up (or the host sync hasn't run yet). Fall back to `send_file` and tell the user the page link isn't available.
2. Write the page to `/workspace/agent/public/<name>.html`. Group related files in subfolders (`public/budget/2026-09.html`).
3. Reply with the full link: `<base-url>/<name>.html`. Post it as a bare URL so it's clickable.

## Rules

- **Everything in `public/` is visible to anyone on the tailnet, and folder listings are on.** Never write memory, credentials, tokens, transcripts, or raw data dumps there. Publish the page, not the source data.
- **Self-contained pages.** Inline CSS and JS where practical. CDN scripts work (the viewer's browser loads them), but a page with no external dependencies won't break later.
- **Mobile first.** The user often opens links on a phone: include `<meta name="viewport" content="width=device-width, initial-scale=1">` and keep layouts responsive.
- **Stable names for living pages.** Overwrite `budget.html` in place for a page that updates, so the link stays the same. Use dated or unique names for one-off snapshots. Tell the user to refresh if a page was updated, since browsers may cache.
- **Clean up.** Delete throwaway pages when they're no longer useful.
- You can't fetch the URL from inside the container (it's on the tailnet), so check the file on disk instead of with curl.
- For charts, follow the `dataviz` skill; for larger interactive pages, follow `frontend-engineer`.
