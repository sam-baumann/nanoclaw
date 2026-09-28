---
name: onecli-app-setup
description: Walk the user through setting up an OAuth app in the self-hosted OneCLI gateway (GitHub, Google, Slack, Linear, etc.) so it can be connected. Use when the gateway or dashboard says an app "is not configured" / "Missing required credentials", when the user asks how to connect a new service, or before handing out a connect link for an app that has never been set up.
---

# Setting up an app in OneCLI

This OneCLI is self-hosted, so it has no built-in OAuth clients. Before an OAuth app (GitHub, Gmail, Google Drive, Slack, ...) can be connected, the user has to register their own OAuth app with that provider once and paste its client ID/secret into the OneCLI dashboard. After that, connecting is the usual one-click flow.

You guide; the user does the clicks. You never see or handle the secrets.

## Facts you need

- Dashboard base URL: `cat /workspace/agent/.gateway-url` (e.g. `https://nanoclaw.<tailnet>.ts.net:10254`). It opens only on the user's tailnet devices, and you can't reach it from the container.
- The OAuth callback URL for any app is:
  `<dashboard base>/v1/apps/<app-id>/callback`
  e.g. `https://nanoclaw.<tailnet>.ts.net:10254/v1/apps/github/callback`. The dashboard's configure dialog also shows it with a copy button, so tell the user to copy it from there if in doubt.
- The callback is only a browser redirect. The provider never has to reach it, so a tailnet URL is fine.
- App ids: `github`, `github-app`, `gitlab`, `gmail`, `google-calendar`, `google-drive`, `google-docs`, `google-sheets`, `slack`, `linear`, `notion`, `jira`, `confluence`, `dropbox`, `zoom`, `outlook-mail`, and others. When unsure, take it from the `connect=<id>` part of the connect link.

## Walkthrough

Go one step at a time, and wait for the user to confirm each step before sending the next.

1. **Say what's needed.** "OneCLI needs an OAuth app for <Service> first. That's a one-time setup of about 3 minutes."
2. **Send the provider's registration page and the exact values to enter** (see the recipes below). Put each URL on its own line.
3. **Tell them to copy the client ID and generate a client secret.** Say: "Don't paste these into chat. They go into the OneCLI dashboard."
4. **Point them at the dashboard.** Open `<dashboard base>/`, go to Connections, pick <Service>, open Configure (or the settings/gear), paste the Client ID and Client Secret, and save.
5. **Connect.** Send the connect link (`<dashboard base>/p/<project>/connections?connect=<id>&source=agent&agent_name=<your name>`, or the `connect_url` from the gateway error). They approve on the provider's consent screen.
6. **Verify.** Retry the original request, e.g. `curl -s https://api.github.com/user`. If it still returns 401 `app not connected`, ask whether the consent screen finished. If they got a redirect_uri mismatch error, the callback URL registered at the provider doesn't exactly match `<dashboard base>/v1/apps/<id>/callback`.

## Recipes

**GitHub (`github`)**: https://github.com/settings/applications/new
- Application name: anything (e.g. "NanoClaw OneCLI")
- Homepage URL: `<dashboard base>`
- Authorization callback URL: `<dashboard base>/v1/apps/github/callback`
- Leave "Enable Device Flow" unchecked. Click Register, copy the Client ID, then "Generate a new client secret".

**GitHub App (`github-app`)**: only if they want fine-grained, per-repo or org-approved access instead of a classic OAuth app. It needs an App ID, App Slug and private key (.pem) from https://github.com/settings/apps/new, with the callback URL above using `github-app`. If they're unsure, recommend plain `github`.

**Google (`gmail`, `google-calendar`, `google-drive`, ...)**: https://console.cloud.google.com/apis/credentials
- Create or pick a project. Enable the API for the service (Gmail API, Calendar API, ...) under "APIs & Services → Library".
- Set up the OAuth consent screen: External, and add the user's own Google account as a test user.
- Create Credentials → OAuth client ID → Web application. Under "Authorized redirect URIs", add `<dashboard base>/v1/apps/<id>/callback` once for each Google app they plan to use. One client can serve all of them.
- While the app is in "Testing", Google refresh tokens expire after 7 days. Mention this, and suggest publishing the consent screen if that becomes annoying.

**Any other provider**: search that provider's developer docs for "create OAuth app". Use the callback pattern above, and tell the user which fields the OneCLI configure dialog asks for (it shows a hint).

## Rules

- Never ask for, accept, or repeat client secrets, tokens, or keys in chat. If the user pastes one anyway, tell them to rotate it at the provider.
- Always use the tailnet dashboard base from `.gateway-url`, never `localhost`.
- API-key services (not OAuth) need no app registration. The user adds the key in the dashboard under Secrets.
