# NanoClaw Migration Guide

Generated: 2026-04-24
Last upgraded: 2026-04-24
Base: eba94b721ab8c7476e97d6600ca7ee4c0e53249c
HEAD at generation: c79b87d
HEAD after upgrade: c3b035703472d6127bb1fc34e0f0b189d2f603d5
Upstream at upgrade: 8d8522202a0604d187f9da132c59f386e3c489a9

---

## Migration Plan

This is a v1 → v2 migration. The v2 rewrite changes the architecture substantially:
the channel adapter interface, session DB split, router, index.ts, and
container agent-runner are all new. v1 code cannot be merged — it must be
reapplied on the v2 base after skills are merged.

**Order of operations:**

1. Start from clean `upstream/main` (v2)
2. Apply skills: `/add-discord`, `/add-compact`, `/add-ollama-tool`, `channel-formatting`
3. Copy custom skills: `ics-reader`, `pdf-reader` skill files
4. Apply Dockerfile customizations (poppler-utils + pdf-reader CLI)
5. Apply source customizations: trusted users in config + compact auth
6. Add Discord PDF attachment downloading to v2 discord adapter
7. Build and validate

**Risk areas:**

- Discord PDF downloading: v2 uses a Chat SDK bridge adapter (`createChatSdkBridge`)
  instead of raw discord.js. The v1 attachment hook pattern won't translate
  directly — see the customization section for guidance.
- Trusted users in compact: `isSessionCommandAllowed` in v2 has a different
  signature — needs the trustedSenders and senderId params added after the
  skill is merged.
- groups/ directory: gitignored and not touched by the upgrade. All content
  (CLAUDE.md files, agent memory, conversations) persists automatically.

---

## Applied Skills

Re-apply each of these by merging the upstream skill branch in the worktree.

- `add-discord` — branch `upstream/channels` (v2 Chat SDK bridge adapter)
- `add-compact` — branch `upstream/skill/compact`
- `channel-formatting` — branch `upstream/skill/channel-formatting`

**Note on Discord:** The v2 discord adapter lives on `upstream/channels`, not
a dedicated skill branch. Merge it with:

```bash
git merge upstream/channels --no-edit
```

Then append `import './discord.js';` to `src/channels/index.ts` if not already present, and install the adapter package:

```bash
pnpm install @chat-adapter/discord@4.26.0
```

---

## Custom Skills

These are not from upstream and must be copied from the main tree into the worktree.

### ics-reader

**Source:** `container/skills/ics-reader/` in the main tree

**How to apply:** Copy the entire directory:

```bash
cp -r "$PROJECT_ROOT/container/skills/ics-reader" "$WORKTREE/container/skills/ics-reader"
```

**Files:**

`container/skills/ics-reader/SKILL.md`:

```markdown
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
```

`container/skills/ics-reader/ics-fetch` — copy verbatim from main tree.

---

### pdf-reader (container skill files)

The pdf-reader skill came from `whatsapp/skill/pdf-reader` but is still needed
for Discord PDF attachment support. Since WhatsApp is not being applied, copy
the container skill files manually.

**How to apply:**

```bash
cp -r "$PROJECT_ROOT/container/skills/pdf-reader" "$WORKTREE/container/skills/pdf-reader"
```

---

## Skill Interactions

**channel-formatting + discord:** Both skills touch `src/channels/index.ts`.
After merging both, confirm `index.ts` contains exactly one import for each:
`import './discord.js'` and (if channel-formatting adds any imports) those too.
No duplicate lines.

**compact + trusted-users customization:** After merging `upstream/skill/compact`,
the `isSessionCommandAllowed` function in `src/session-commands.ts` must be
modified to add trusted-users support (see Customizations section). Do this
AFTER the skill is merged, not before.

---

## Customizations

### PDF tooling in Dockerfile

**Intent:** Enable PDF text extraction in agent containers. Required for the
pdf-reader container skill to work (both from Discord attachments and agent-
initiated reads).

**Files:** `container/Dockerfile`

**How to apply:**

1. In the apt-get install block, add `poppler-utils` alongside the other system packages:

```dockerfile
    curl \
    git \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*
```

2. After the `COPY agent-runner/` and build steps (near the end of the build
   stage, before workspace mkdir), add:

```dockerfile
# Install pdf-reader CLI
COPY skills/pdf-reader/pdf-reader /usr/local/bin/pdf-reader
RUN chmod +x /usr/local/bin/pdf-reader
```

---

### Trusted users for /compact

**Intent:** Discord messages always have `is_from_me=false` (the bot never
sees its own user as the sender). Without this change, only the main group
can use /compact. The trusted-users list lets the operator authorize specific
Discord user IDs to run /compact in any group.

**Files:** `src/config.ts`, `src/session-commands.ts`, `src/index.ts`

**How to apply — step 1:** In `src/config.ts`, add `fs` import at top if not
already present, then add `TRUSTED_USERS_PATH` and `loadTrustedUsers()` after
the other allowlist path constants:

```typescript
import fs from 'fs';
```

```typescript
export const TRUSTED_USERS_PATH = path.join(HOME_DIR, '.config', 'nanoclaw', 'trusted-users.json');

export function loadTrustedUsers(pathOverride?: string): string[] {
  const filePath = pathOverride ?? TRUSTED_USERS_PATH;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'sessionCommandUsers' in parsed &&
      Array.isArray((parsed as Record<string, unknown>).sessionCommandUsers) &&
      ((parsed as Record<string, unknown>).sessionCommandUsers as unknown[]).every(
        (v) => typeof v === 'string',
      )
    ) {
      return (parsed as { sessionCommandUsers: string[] }).sessionCommandUsers;
    }
  } catch {
    // fall through
  }
  return [];
}
```

**How to apply — step 2:** In `src/session-commands.ts` (added by the compact
skill), change `isSessionCommandAllowed` to accept trusted senders:

Change from:
```typescript
export function isSessionCommandAllowed(isMainGroup: boolean, isFromMe: boolean): boolean {
  return isMainGroup || isFromMe;
}
```

Change to:
```typescript
export function isSessionCommandAllowed(
  isMainGroup: boolean,
  isFromMe: boolean,
  trustedSenders: string[],
  senderId: string,
): boolean {
  return isMainGroup || isFromMe || trustedSenders.includes(senderId);
}
```

**How to apply — step 3:** In `src/index.ts`, find all call sites of
`isSessionCommandAllowed` (added by the compact skill merge) and update them
to pass the two new arguments. Import `loadTrustedUsers` from config and add
`trustedSenders: loadTrustedUsers()` and the sender ID. The sender ID is the
`msg.sender` field on the inbound message. For example:

```typescript
import { loadTrustedUsers } from './config.js';

// In the isSessionCommandAllowed call:
isSessionCommandAllowed(isMainGroup, msg.is_from_me, loadTrustedUsers(), msg.sender)
```

Find every call to `isSessionCommandAllowed` in index.ts (there will be at
least two: one in `processGroupMessages` and one in `startMessageLoop`) and
update both.

**File for trusted users:** Create `~/.config/nanoclaw/trusted-users.json`:

```json
{
  "sessionCommandUsers": ["your-discord-user-id-here"]
}
```

---

### Discord PDF attachment downloading

**Intent:** When a Discord user sends a PDF file, download it to the group's
`attachments/` folder so the agent can read it with the pdf-reader skill.

**Files:** `src/channels/discord.ts`

**Background:** In v1, `discord.ts` was a raw discord.js implementation that
intercepted `MessageCreate` events directly. In v2, the Discord adapter uses
`createDiscordAdapter` from `@chat-adapter/discord` and `createChatSdkBridge`.
The v2 adapter receives messages as pre-parsed objects; raw attachment
downloading must be added as a hook.

**How to apply:**

Read the upstream/channels version of `src/channels/discord.ts` after the
skill is merged. Look for where the adapter is constructed — specifically the
`createChatSdkBridge` call. The `@chat-adapter/discord` adapter surfaces
attachment metadata in messages as part of the content object.

The v1 implementation pattern for reference (adapt to the v2 bridge API):

```typescript
// In the MessageCreate handler — after determining this message has a PDF attachment:
if (contentType === 'application/pdf') {
  try {
    const res = await fetch(att.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const groupDir = path.join(GROUPS_DIR, group.folder);
    const attachDir = path.join(groupDir, 'attachments');
    fs.mkdirSync(attachDir, { recursive: true });
    const filename = path.basename(att.name || `doc-${Date.now()}.pdf`);
    const filePath = path.join(attachDir, filename);
    fs.writeFileSync(filePath, buf);
    // Append to message text so agent knows file is available
    textParts.push(`[PDF saved to attachments/${filename} — use pdf-reader to extract text]`);
  } catch (err) {
    textParts.push(`[PDF attachment (download failed)]`);
  }
}
```

If the v2 Chat SDK bridge doesn't expose a pre-message hook, an alternative is
to implement a thin wrapper that intercepts the raw discord.js client events
before delegating to the bridge. Check whether `createDiscordAdapter` accepts
an `onMessage` or `transformMessage` callback.

If neither approach is cleanly available, file this as a follow-up task and
proceed without PDF downloading for the initial v2 upgrade. The pdf-reader
skill will still work for files the agent creates or downloads via tool calls.

---

### Typing indicator keepalive for Discord

**Intent:** For long agent responses, Discord shows the bot as "typing" for
only ~10 seconds before the indicator disappears. This fix renews the typing
indicator every 5 seconds while the agent is working.

**Files:** `src/channels/discord.ts`

**How to apply:**

Check whether the v2 `@chat-adapter/discord` adapter handles typing indicator
renewal automatically. If it does, no action needed. If not, after applying
the discord skill, add the following to the v2 adapter's `setTyping` method:

```typescript
// In setTyping — start interval to renew every 5s
const sendTyping = async () => { /* call discord channel.sendTyping() */ };
await sendTyping();
const interval = setInterval(sendTyping, 5000);
this.typingIntervals.set(platformId, interval);

// In the clearTyping path — clear the interval:
const existing = this.typingIntervals.get(platformId);
if (existing) {
  clearInterval(existing);
  this.typingIntervals.delete(platformId);
}
```

---

## Preserved Data (no action needed)

The following are in gitignored directories and survive the upgrade automatically:

- `groups/global/CLAUDE.md` — Sam's user profile + scheduled task guidance
- `groups/main/CLAUDE.md` — "Andy" persona for the main agent group
- `store/auth/` — Discord/WhatsApp auth credentials
- `data/` — session databases
- `.env` — environment variables

These do not need to be copied or reapplied. They will be present after swap.

note from user: please ensure discord channel setups stay as is. you also may choose to skip the discord specific fixes, because the discord integration has been rewritten in V2. you also can skip adding ollama, i dont use it.
