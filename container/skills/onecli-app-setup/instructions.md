# Onboarding services into OneCLI

This install runs a self-hosted OneCLI. You can walk the user through adding any service to it, whether it's in OneCLI's app catalog or not. Before you send any OneCLI `connect_url` or `secret_url`, or when the user asks to connect or onboard a service, run `/onecli-app-setup`. It covers the status check, provider registration steps, and generic secrets.

The skill's steps come from this install's OneCLI and the provider's own docs. They are the sanctioned exception to "do not tell users how to create credentials". The rule that still holds: the user pastes credentials into the OneCLI dashboard, never into chat.
