# OneCLI app catalog: where to register

The callback URL for every OAuth app below is `<dashboard base>/v1/apps/<id>/callback`. The configure form in the dashboard shows the exact fields for each app. Types and availability come from OneCLI 1.41.0, and the live values are in `/workspace/agent/.onecli-apps.json`.

## OAuth apps (need your own OAuth app once)

- `github` (GitHub): https://github.com/settings/applications/new
  - Leave Device Flow off. Register it, copy the Client ID, then click "Generate a new client secret".
- `github-app` (GitHub App): https://github.com/settings/apps/new
  - For fine-grained, per-repo or org-approved access. Needs an App ID, App Slug and private key (.pem). If the user isn't sure, recommend plain `github`.
- `gitlab` (GitLab): https://gitlab.com/-/user_settings/applications
  - Set the Redirect URI. You get an Application ID and Secret.
- Google apps: `gmail`, `google-calendar`, `google-drive`, `google-docs`, `google-sheets`, `google-slides`, `google-forms`, `google-tasks`, `google-contacts`, `google-chat`, `google-meet`, `google-photos`, `google-admin`, `google-analytics`, `google-classroom`, `google-search-console`, `youtube`. Register at https://console.cloud.google.com/apis/credentials
  - Create or pick a project, then enable each service's API under "APIs & Services → Library" (Gmail API, Google Calendar API, ...).
  - OAuth consent screen: External. Add the user's own Google account as a test user.
  - Credentials → Create OAuth client ID → Web application. Add one "Authorized redirect URI" per Google app used (`.../v1/apps/gmail/callback`, `.../v1/apps/google-calendar/callback`, ...). One client can serve all of them, so paste the same ID and secret into each Google app's configure form.
  - While the consent screen is in "Testing", refresh tokens expire after 7 days. Publishing the app avoids that.
- `notion` (Notion): https://www.notion.so/profile/integrations
  - Create a **public** integration (OAuth), not an internal one. Set the redirect URI.
- `jira`, `confluence` (Atlassian): https://developer.atlassian.com/console/myapps/
  - Create an OAuth 2.0 (3LO) app. Add the callback under Authorization, and add the Jira or Confluence API permissions.
- `todoist` (Todoist): https://developer.todoist.com/appconsole.html
- `dropbox` (Dropbox): https://www.dropbox.com/developers/apps
  - Scoped access. Add the redirect URI under OAuth 2. The App key is the client ID.
- `monday` (monday.com): the Developer Center, reached from the avatar menu → Developers.
- `supabase` (Supabase): organization settings → OAuth Apps in the Supabase dashboard.
- `linkedin` (LinkedIn): https://www.linkedin.com/developers/apps
  - Add the redirect URL under Auth.
- `trello` (Trello): https://trello.com/power-ups/admin
  - Create a Power-Up to get an API key.

## API-key apps

- `resend`: https://resend.com/api-keys
- `cloudflare`: https://dash.cloudflare.com/profile/api-tokens (use a scoped API token)
- `flyio`: `fly tokens create`, or the Fly.io dashboard → Tokens
- `vercel`: https://vercel.com/account/tokens
- `jfrog-artifactory`: an identity token from the user's Artifactory profile page

## Credential-import apps

`docker` (Docker Hub), `vertex-ai`, `aws`, `mongodb-atlas`: the dashboard form lists what to import, such as an access token, a service-account JSON, or an access key pair. Point the user to that provider's own docs for creating it, with minimum scopes.

## Cloud-only (not available here, so use a generic secret)

`slack`, `linear`, `zoom`, `sentry`, `hubspot`, `datadog`, `attio`, `affinity`, `x`, `fathom`, `fireflies`, `outlook-mail`, `outlook-calendar`, `microsoft-word`, `microsoft-onenote`, `aws-role`.

Most of these have static tokens that work as a generic secret, for example:
- Linear: a personal API key, sent as `Authorization: {value}`
- Slack: a bot token, sent as `Authorization: Bearer {value}`
- Sentry: an auth token, sent as `Authorization: Bearer {value}`

Always confirm the header format in the provider's API docs. Microsoft 365 (Outlook/Word/OneNote) is OAuth-only, so it can't be added here.
