# Nova AI

Nova AI is a **full-stack, cyberpunk-styled personal AI workspace**. It uses Manus OAuth for identity, stores conversation history in a database scoped to each authenticated user, and sends the retained multi-turn context to a configured server-side AI provider. The browser never receives provider credentials.

> **Important:** This project can use GitHub as its source-control home, but it cannot run on GitHub Pages alone. GitHub Pages serves static files, while Nova AI requires a Node/Express server for OAuth, secure LLM calls, and database access. Use a Node-capable deployment platform for the running application.

## Core capabilities

| Area | Implementation |
|---|---|
| Identity | Manus OAuth gates the `/chat` experience and scopes data access to the signed-in user. |
| Conversation memory | `chat_conversations` and `chat_messages` persist user-owned conversation state. |
| Turn lifecycle | The authenticated `/api/chat/stream` endpoint creates new conversations when needed, persists the user turn before generation, streams the response, and persists the assistant turn on completion. |
| AI context | The latest retained user and assistant turns, prefixed with a configurable system prompt, are sent on each request. |
| Streaming | OpenRouter/Nemotron and Hugging Face use server-side SSE streaming; the built-in provider is delivered progressively through the same interface. |
| Provider routing | Configure a default provider with `NOVA_LLM_PROVIDER`; Nova AI falls back across securely configured providers when possible. |
| Quality checks | `github-actions-ci.yml.template` runs type checking, unit tests, and production builds when copied to `.github/workflows/ci.yml`. |

## Source-project adaptation

The provided `advanced-personal-ai` repository informed the conversation-workspace and history-organizer behavior in this rebuild. Nova AI deliberately adapts those behaviors onto the Manus OAuth, tRPC/Express, and cyberpunk UI foundation rather than copying source code, user data, or credentials. See [SOURCE_INTEGRATION.md](./SOURCE_INTEGRATION.md) for the exact mapping.

## Local development

Install dependencies and start the development server with the following commands.

```bash
pnpm install
pnpm dev
```

Run checks before opening a pull request.

```bash
pnpm check
pnpm test
pnpm build
```

## Configuration

Set configuration only in your hosting provider’s encrypted environment-variable settings. **Never commit a `.env` file or a provider token.**

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | MySQL/TiDB connection for users, conversations, and messages. |
| `JWT_SECRET` | Yes | Signs the application session. |
| `VITE_APP_ID` | Yes | Manus OAuth application identifier. |
| `OAUTH_SERVER_URL` | Yes | Manus OAuth backend URL. |
| `VITE_OAUTH_PORTAL_URL` | Yes | Manus OAuth sign-in portal URL. |
| `BUILT_IN_FORGE_API_URL` | For built-in provider | Server URL for the built-in LLM gateway. |
| `BUILT_IN_FORGE_API_KEY` | For built-in provider | Server-only authorization for the built-in LLM gateway. |
| `NOVA_SYSTEM_PROMPT` | No | Project-level instruction for Nova AI. A safe default is used when empty. |
| `NOVA_LLM_PROVIDER` | No | Preferred provider: `builtin`, `openrouter`, or `huggingface`. |
| `NOVA_LLM_MODEL` | No | Built-in model identifier. Defaults to `gpt-5-mini`. |
| `OPENROUTER_API_KEY` | For Nemotron | Server-only OpenRouter credential. |
| `NOVA_OPENROUTER_MODEL` | No | OpenRouter model. Defaults to `nvidia/nemotron-3-ultra-550b-a55b`. |
| `HUGGINGFACE_API_KEY` | For Hugging Face | Server-only Hugging Face credential. |
| `NOVA_HUGGINGFACE_MODEL` | No | Hugging Face chat model. Defaults to `Qwen/Qwen2.5-7B-Instruct`. |

## Database migration

The initial migration at `drizzle/0001_thick_hulk.sql` creates the persistent conversation tables and indexes. Review generated SQL before applying it to any shared or production database.

```bash
pnpm drizzle-kit generate
```

Apply the reviewed migration through your approved database migration workflow. The managed project environment applies schema changes using its database migration interface; for an external deployment, use the connection and migration policy required by that host.

## Deploy from GitHub

Create a repository, push the project, and connect it to a host that supports a Node service and environment variables. The relevant build and start commands are shown below.

| Hosting setting | Value |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Runtime | Node.js 22 |
| Required callback URL | `https://YOUR_DOMAIN/api/oauth/callback` |

Set the callback URL above in the Manus OAuth application settings, then add the environment variables listed earlier through the selected host’s secret manager. For every deploy, verify the sign-in redirect, the first streamed response, a follow-up response using saved context, and the user’s history sidebar.

To push to GitHub after reviewing local changes, use a branch and pull request rather than directly overwriting `main`.

```bash
git checkout -b feature/nova-cyberpunk-chat
git add .
git commit -m "Build Nova AI cyberpunk chat experience"
git push -u origin feature/nova-cyberpunk-chat
```

The repository delivery includes `github-actions-ci.yml.template` instead of an active workflow because the current GitHub App token cannot create workflow files. After reviewing the branch with an account that has workflow permission, move this file to `.github/workflows/ci.yml` to activate CI.

## References

[1]: https://docs.github.com/en/pages "GitHub Pages documentation"
[2]: https://docs.github.com/en/actions "GitHub Actions documentation"
[3]: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions "Using secrets in GitHub Actions"
