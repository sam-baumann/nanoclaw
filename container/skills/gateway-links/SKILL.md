---
name: gateway-links
description: Rewrite OneCLI credential-gateway links (http://localhost:10254/...) to the user's tailnet URL before sending them. Use whenever a connect_url, dashboard link, or any localhost:10254 URL is about to go to the user, e.g. after an app_not_connected / 401 / 403 from the gateway.
---

# Gateway links over the tailnet

The OneCLI gateway returns links like `http://localhost:10254/p/.../connections?connect=github`. "localhost" means the NanoClaw VM, so they don't open on the user's phone or laptop. The host proxies the dashboard over the tailnet (tailnet-only, never the public internet) on the same port.

## Steps

1. Read the tailnet base: `cat /workspace/agent/.gateway-url` (e.g. `https://nanoclaw.tail1234.ts.net:10254`).
2. Replace the scheme+host+port prefix `http://localhost:10254` (or `http://127.0.0.1:10254`) with that base. Keep the path and query string exactly as they are.
   - `http://localhost:10254/p/abc/connections?connect=github` becomes `https://nanoclaw.tail1234.ts.net:10254/p/abc/connections?connect=github`
3. Send the rewritten URL as a bare URL on its own line.

If `.gateway-url` is missing, send the original link and tell the user it only opens on the VM (for example, through `ssh -L 10254:localhost:10254 <vm>`).

## Rules

- Rewrite only the gateway's own links. Leave everything else alone.
- Don't try to fetch the tailnet URL from inside the container; it isn't reachable from here.
- Never ask for tokens or keys in chat. The connect flow in the dashboard is the only way to add credentials.
