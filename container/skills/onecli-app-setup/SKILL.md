---
name: onecli-app-setup
description: Onboard any service into the self-hosted OneCLI gateway, whether it's a catalog OAuth app (GitHub, Google, Notion, ...), an API-key app, or a service OneCLI has never heard of (generic secret). Use when the user asks to connect or onboard a service, before sending any OneCLI connect_url or secret_url, or when a gateway call returns 401/app_not_connected or the user reports "not configured".
---

# Onboarding a service into OneCLI

You guide; the user clicks. Credentials go into the OneCLI dashboard, never into chat. Go one step at a time and wait for the user after each step.

## Facts

- Dashboard base: `cat /workspace/agent/.gateway-url` (e.g. `https://nanoclaw.<tailnet>.ts.net:10254`). It opens only on the user's tailnet devices. You can't reach it from the container.
- Live status: `/workspace/agent/.onecli-apps.json`, refreshed by the host every minute. Each entry has `id`, `name`, `type`, `available`, `needs_oauth_app` and `connected`.
- The OAuth callback URL for catalog app `<id>` is `<dashboard base>/v1/apps/<id>/callback`.
- Provider registration pages and quirks: see `apps.md` next to this file.
- Every OneCLI agent here uses **selective** secret access, so the user must grant this agent access to anything they add. The connect link's `agent_name=` does this for apps. Secrets must be assigned to the agent at `<dashboard base>/agents`. Existing secrets are listed at `<dashboard base>/connections/secrets`.

## 1. Classify the service

Look it up in `.onecli-apps.json` (match by `id` or `name`):

- `type: "oauth"`, `available: true` → go to section 2.
- `type: "api_key"` or `"credentials_import"` → go to section 3.
- `type: "cloud_only"` (Slack, Linear, Zoom, Outlook, Sentry, HubSpot, X, ...) or not listed → go to section 4 (generic secret). Say briefly that OneCLI's built-in app for it only exists in OneCLI Cloud.
- `connected: true` → it's already set up. Just make the request. If it still fails, see "Verify".

If `.onecli-apps.json` is missing, ask the user whether they have already set the app up in OneCLI, then continue.

## 2. Catalog OAuth app

**If `needs_oauth_app: true`:** do this one-time setup first. Otherwise skip to "Connect".

1. Say: "OneCLI needs its own OAuth app for <Service> first. This is a one-time setup of about 3 minutes."
2. Send the registration page from `apps.md`, plus the exact values:
   - Callback / redirect URL: `<dashboard base>/v1/apps/<id>/callback`
   - Homepage / app URL, if asked: `<dashboard base>`
   - Any quirks listed for that provider (APIs to enable, test users, and so on).
3. Say: "Copy the client ID and secret into the OneCLI dashboard, not into chat." Tell them to open `<dashboard base>/connections`, pick <Service>, and paste the values into the fields the configure form shows.
4. Wait until they say it's saved. Within about a minute, `needs_oauth_app` flips to false.

**Connect:** send the connect link as a bare URL on its own line:
`<dashboard base>/connections?connect=<id>&source=agent&agent_name=<your agent name>`
(or the gateway's own `connect_url`). They approve on the provider's consent screen.

## 3. API-key / credential-import app

1. Tell the user where to get the key or credential. Use `apps.md` if it's listed; otherwise search the provider's docs and link the official page.
2. Send the connect link (same format as above). The dashboard form asks for the key or file.

## 4. Anything else: generic secret

This works for any HTTP API that accepts a static token: an API key, a personal access token, or a bot token.

1. **Work out the injection from the provider's API docs.** Get these values and say them to the user explicitly:
   - Host pattern: the API host, e.g. `api.linear.app`. A wildcard like `*.example.com` is allowed.
   - Path pattern: usually leave empty.
   - How to inject, one of:
     - Header name plus value format, e.g. `Authorization` with `Bearer {value}`, or `X-Api-Key` with `{value}`.
     - Query parameter name plus format, e.g. `api_key` with `{value}`.
2. **Tell them where to create the token** (link the provider's official docs page) and which scopes to pick. Pick the minimum needed for the request.
3. **The dashboard link:** make the request once without credentials. If the gateway's 401 body contains a `secret_url`, append `&name=<URL-encoded display name>` and send that link, because it comes pre-filled. Otherwise send `<dashboard base>/connections/custom?create=generic&host=<host>&name=<URL-encoded display name>` and tell them to fill in the injection values from step 1.
4. **Grant access:** tell them to open `<dashboard base>/agents`, pick this agent (your agent name), and give it the new secret. It won't be injected otherwise.
5. If the gateway later returns a 403 saying the host "requires an explicit allow rule", send `<dashboard base>/rules?create=allow&host=<host>`.

Limitation: services that only offer OAuth, with no personal or static token, can't be added as a generic secret, because OneCLI can't run the refresh flow for them. Say so plainly rather than inventing a workaround.

## Verify

Retry the original request (e.g. `curl -s https://api.github.com/user`).
- Still returning 401 `app not connected`: the consent screen didn't finish, or this agent wasn't granted access.
- A "redirect_uri mismatch" error at the provider: the registered callback doesn't exactly match `<dashboard base>/v1/apps/<id>/callback`.
- A 401 from the service itself: the token or scopes are wrong, or the injection header or format doesn't match the API docs.
- A 403 JSON from the gateway with a policy message: a OneCLI rule blocked it. Tell the user, and don't retry around it.

Report success only after a credentialed request succeeds.

## Rules

- Never ask for, accept, or repeat secrets in chat. If the user pastes one anyway, tell them to rotate it.
- Always use the tailnet dashboard base, never `localhost`.
- Link only official provider pages. If you're unsure of a provider's current console URL, search for it rather than guessing.
