# Tickets — Project Instructions

## Git Workflow

- **Never commit directly to `main`.** All changes must go through pull requests.
- Create a feature branch, commit there, push, open a PR, then merge.
- **Do not merge PRs unless the user explicitly tells you to.** Always present the PR for review first.
- Branch protection is enforced on `main` (requires PR, no force pushes, enforced for admins).

## Deployment

- Deployed to Cloud Run in `minutebox-marketing` project.
- **Only deploy `main`. Only deploy when the user explicitly asks you to.**
- No CI/CD — deploy is manual: `just deploy` or the full `gcloud run deploy` command.
- Always include secrets and env vars when deploying:
  ```
  --set-secrets="GOOGLE_SA_KEY_JSON=tickets-workspace-sa-key:latest"
  --set-env-vars="GOOGLE_ADMIN_EMAIL=daniel@minutebox.com"
  ```

## Tech Stack

- SvelteKit 5 + Svelte 5 (runes: $state, $derived, $effect)
- Bun runtime
- Tailwind CSS 4
- BigQuery for persistence (dataset: `minutebox-marketing.tickets`)
- Google Cloud IAP for authentication
- Google Admin Directory API for team roster
