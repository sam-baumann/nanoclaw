---
name: ics-reader
description: Read ICS/iCal calendar feeds from URLs. Use when the user asks about upcoming events, show releases, schedule, or anything involving a calendar URL. Also use for daily digest tasks.
---

# ICS Calendar Reader

Fetch and parse ICS calendar feeds from any URL (https://, http://, webcal://).

## Tool

```bash
node /home/node/.claude/skills/ics-reader/ics-fetch <url> [--days N] [--past N] [--json]
```

Options:
- `--days N` — look ahead N days (default: 30)
- `--past N` — also include events N days in the past (default: 0)
- `--json` — output raw JSON for programmatic use

## Examples

```bash
# Show events in the next 14 days
node /home/node/.claude/skills/ics-reader/ics-fetch https://example.com/calendar.ics --days 14

# Show events today and yesterday
node /home/node/.claude/skills/ics-reader/ics-fetch https://example.com/calendar.ics --days 1 --past 1

# Get JSON output
node /home/node/.claude/skills/ics-reader/ics-fetch https://example.com/calendar.ics --days 7 --json
```

## Storing Calendar URLs

Save calendar URLs in your workspace so the user doesn't need to repeat them:

```bash
# Read/write calendars.json in the group workspace
cat /workspace/group/calendars.json 2>/dev/null || echo '{}'
```

Format:
```json
{
  "TV Shows": "https://example.com/tv-shows.ics",
  "Work": "https://example.com/work.ics"
}
```

When the user gives you a calendar URL, save it to `calendars.json` with a label they provide (or one you infer).

## Daily TV Show Digest

When the user asks to be notified daily about upcoming TV show releases:

1. Save the calendar URL to `calendars.json`
2. Schedule a daily task using the MCP tool:

```
mcp__nanoclaw__schedule_task(
  prompt: "Read /workspace/group/calendars.json, then for each calendar run: node /home/node/.claude/skills/ics-reader/ics-fetch <url> --days 14. Report any shows airing today or in the next 7 days in a friendly message. If nothing is airing soon, say so briefly.",
  schedule_type: "cron",
  schedule_value: "0 9 * * *"
)
```

Adjust the time and days window to the user's preference.

## Handling Multiple Calendars

```bash
# Read all calendars from calendars.json and fetch each
node -e "
const cals = JSON.parse(require('fs').readFileSync('/workspace/group/calendars.json', 'utf8'));
Object.entries(cals).forEach(([name, url]) => {
  console.log('=== ' + name + ' ===');
});
"
```

Then run `ics-fetch` for each URL and combine the results.
