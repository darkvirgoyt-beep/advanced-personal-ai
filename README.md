# Nova AI — Advanced Personal AI Workspace

> **Created and maintained by VirgoYT.** Nova AI is a self-hostable personal AI workspace for private chat, developer workflows, GitHub repositories, custom AI providers, and local-server tools.

Nova AI is a full-stack Express, React, tRPC, and MySQL application. It includes persistent conversations, a secret vault, file uploads, custom models and tools, chart saving, GitHub connection, optional Google sign-in, and a terminal workspace. This repository is the complete runnable source code for **Nova AI by VirgoYT**.

## What you get

| Area | Capability |
|---|---|
| AI workspace | Persistent chat, saved history, markdown, file attachments, charts, secret vault, custom tools |
| Providers | Groq, Kie AI presets, OpenRouter/NVIDIA Nemotron 3 Ultra, and custom OpenAI-compatible endpoints |
| GitHub | Per-workspace OAuth connection, repository picker in chat, and repository context |
| Local hosting | Local upload storage, MySQL/TiDB support, Docker configuration, Termux/macOS/Linux/Windows launchers |
| Branding | **Nova AI by VirgoYT** attribution in the portable source and documentation |

> **Important:** GitHub Pages only publishes static HTML, CSS, and JavaScript files. Nova AI needs a Node.js server and MySQL-compatible database, so it cannot run as a full application on GitHub Pages. Keep the code on GitHub, then deploy it to a Node/Docker host or run it locally. [1]

## Fastest starts

### Android Termux — one command

Install Termux from a trusted source, open it, then run the following one command. It clones Nova AI, installs Node.js when needed, asks for a reachable MySQL/TiDB connection string on first use, builds the app, and starts it locally.

```bash
curl -fsSL https://raw.githubusercontent.com/darkvirgoyt-beep/advanced-personal-ai/main/scripts/bootstrap-termux.sh | bash
```

Open **http://127.0.0.1:3000** in your Android browser after the launcher finishes. Termux uses package management similar to Debian/Ubuntu; Nova’s launcher uses `pkg` only to install its required local runtime. [2]

> The Termux app needs a reachable MySQL/TiDB database. A database on the public internet should use TLS, a strong password, and restricted network access. The local terminal feature runs commands on your Termux device, so only use commands you understand.

### macOS or Linux — one command after cloning

```bash
git clone https://github.com/darkvirgoyt-beep/advanced-personal-ai.git nova-ai && cd nova-ai && bash scripts/start-local.sh
```

The first run creates `.env`. Fill `DATABASE_URL` and `JWT_SECRET`, then run the same command again. The launcher uses Corepack to honor the project’s pinned pnpm version; Corepack manages package-manager versions for Node projects. [3]

### Windows PowerShell — one command after cloning

```powershell
git clone https://github.com/darkvirgoyt-beep/advanced-personal-ai.git nova-ai; cd nova-ai; powershell -ExecutionPolicy Bypass -File .\scripts\start-windows.ps1
```

Install **Node.js 22 or newer** and Git first. The script creates `.env` on its first run. Set `DATABASE_URL` and `JWT_SECRET`, then rerun the command.

### Docker — local full stack

```bash
cp config/self-host.env.template .env
# Edit .env: set JWT_SECRET, MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, and DATABASE_URL.
# For Compose, DATABASE_URL should use the db hostname:
# mysql://nova_user:YOUR_PASSWORD@db:3306/nova_ai
docker compose up --build
```

Open **http://127.0.0.1:3000**. The app runs database migrations during the launcher route; Docker users can run the same migration explicitly with `docker compose exec app pnpm db:push`.

## Configure self-hosting

Copy [`config/self-host.env.template`](./config/self-host.env.template) to `.env` and set the following values. Keep `.env` out of Git.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | MySQL/TiDB connection for all workspace data |
| `JWT_SECRET` | Yes | Long random secret for sessions |
| `PUBLIC_APP_URL` | Production | Your final HTTPS URL, used to create OAuth callback URLs |
| `STORAGE_MODE=local` | Local / single server | Stores attachments under `LOCAL_STORAGE_DIR`; mount it as persistent storage in containers |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional | Enables Connect GitHub |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional | Enables Google sign-in |

The application creates an anonymous browser workspace even without account sign-in. Google sign-in is optional. For an independent host, configure the Google credentials below; the older Manus OAuth integration is not required for anonymous local use.

## Connect GitHub

Create a GitHub OAuth App and set its **Authorization callback URL** to:

```text
https://YOUR_DOMAIN/api/nova-github
```

Set the generated client ID and secret in your host’s encrypted environment configuration as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. In Nova AI, open **Git**, click **Authorize GitHub**, then select one or more repositories from the Chat composer when you want that repository context available to the assistant.

## Google sign-in

Create a Google OAuth client and add this exact authorized redirect URI:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your host environment. Google sign-in remains optional; local anonymous workspaces work without it.

## Add or change AI models

Open **Models** in Nova AI and choose a provider preset or add any OpenAI-compatible endpoint. API keys are stored only for the current workspace and are not returned to the browser after saving.

| Provider | Setup path |
|---|---|
| Groq | Enter a valid `gsk_...` key at the first-run key gate |
| Kie AI | **Models → Kie AI chat models → Configure**; save and activate the chosen preset |
| NVIDIA Nemotron 3 Ultra | **Chat → Add Nemotron or another model** or **Models → OpenRouter chat models → Add Nemotron 3 Ultra**; enter an `sk-or-v1-...` OpenRouter key and click **Save & Activate Model** |
| Any compatible endpoint | **Models → Add custom model**; supply provider, endpoint, model ID, and API key |

After saving, use the visible **Chat model** dropdown above the message box. A provider appears there only when it has a saved key and its **Active** switch is on. The dropdown displays published estimated performance and token-price information where available; actual billing and latency vary by provider and request.

## Deploy for your own public URL

Push this repository to GitHub, then use a hosting provider that supports a Node.js/Docker service and a MySQL-compatible database. Examples include a provider you already use, a VPS, or a Docker-capable platform. Configure the supplied `Dockerfile`, add the variables in [`ENVIRONMENT.md`](./ENVIRONMENT.md), attach persistent disk storage for `LOCAL_STORAGE_DIR`, and set `PUBLIC_APP_URL` to the HTTPS address that provider gives you.

| Deployment setting | Value |
|---|---|
| Build | `docker build .` or detect the included `Dockerfile` |
| Runtime port | `3000` or the host-provided `PORT` |
| Database | Managed MySQL/TiDB or your protected MySQL server |
| Uploaded files | Persistent mounted path matching `LOCAL_STORAGE_DIR`, or replace local storage with S3-compatible storage for multiple replicas |
| Your new URL | The hosting provider assigns one, or connect a domain you own and set `PUBLIC_APP_URL` to it |

Nova AI does **not** need the current managed preview URL when you run it from this repository. A separate public URL cannot be created automatically without access to the external host account or domain where you choose to deploy it.

## How Nova follows your commands

Nova sends your instructions to the AI model selected in the **Chat model** dropdown and preserves the working context you provide, including enabled repository selections and files. In a self-hosted installation, the built-in terminal runs commands on **your own host or Termux device**. You remain responsible for commands that change files, services, remote repositories, deployments, credentials, or external accounts. This keeps the application useful for direct development and automation while preventing unreviewed access to systems you do not control.

The Bash launchers are syntax-checked and covered by repository tests. The Windows launcher is structurally covered by the same test suite; run it on a Windows machine before relying on it for production operations.

## Security and operational limits

The terminal executes commands on the host running Nova AI. Do **not** expose the terminal as a public shared service without strong authentication, authorization, isolation, logging, and an allow-list or sandbox. Treat every API key, OAuth secret, database password, and `.env` file as private.

Local file storage is suitable for a single controlled server with persistent disk. Stateless platforms and multi-instance deployments need S3-compatible object storage or another durable shared storage system for uploads.

## Development commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the development server |
| `pnpm db:push` | Generate and apply the current MySQL migration |
| `pnpm test` | Run tests |
| `pnpm check` | Run TypeScript checks |
| `pnpm build && pnpm start` | Build and run production Nova AI |

## Project layout

```text
client/       React workspace UI
server/       Express routes, tRPC, uploads, auth helpers
drizzle/      MySQL schema and migrations
scripts/      Termux, Linux/macOS, and Windows launchers
shared/       Shared constants and TypeScript types
```

## References

[1] [GitHub Docs — What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

[2] [Termux Wiki — Package Management](https://wiki.termux.com/wiki/Package_Management)

[3] [Node.js Corepack documentation](https://nodejs.org/api/corepack.html)

---

**Nova AI by VirgoYT** — build private, portable AI workflows on infrastructure you control.
