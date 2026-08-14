# Nova AI — Advanced Personal AI Workspace

Nova AI is a full-stack personal AI workspace with Groq-backed chat, persistent conversation history, a secret vault, file uploads, custom model and tool configuration, chart saving, GitHub integration, and a terminal workspace. This archive contains the **source code**, rather than a static compiled export, so it can be uploaded to a GitHub repository and deployed on a Node.js host.

> **Hosting model:** this is an Express, React, tRPC, and MySQL application. It cannot run on GitHub Pages because GitHub Pages only serves static files. Deploy it to a host that supports Docker or Node.js plus a MySQL-compatible database.

## What is included

| Area | Included capability |
|---|---|
| AI workspace | Groq API key gate, streaming chat UI, saved chat history, markdown output |
| Private workspace data | Vault entries, saved charts, custom tools, custom OpenAI-compatible models |
| Developer tools | File uploads, GitHub connection UI, source ZIP export, terminal route |
| Deployment | `Dockerfile`, `docker-compose.yml`, `.env.example`, database migrations, and full frontend/backend source |

## Quick start with Docker

Install Docker and Docker Compose, then create a private `.env` file using the values documented in [`ENVIRONMENT.md`](./ENVIRONMENT.md) and update every placeholder value. The value of `DATABASE_URL` must use the `db` hostname when starting with Compose.

```bash
# Create .env from the template in ENVIRONMENT.md, then set:
# DATABASE_URL=mysql://nova_user:YOUR_PASSWORD@db:3306/nova_ai
# JWT_SECRET=<a long random string>
docker compose up --build -d
```

Open `http://localhost:3000` after the containers start. Apply the database schema before first use by running the migration workflow with the same `DATABASE_URL` configured in `.env`.

```bash
docker compose exec app pnpm drizzle-kit generate
docker compose exec app pnpm drizzle-kit migrate
```

## Deploy from GitHub

Upload the extracted files to a new GitHub repository, then connect that repository to a Docker-compatible host such as Render, Railway, Fly.io, Google Cloud Run, or an equivalent provider. Configure the build command as `docker build .` or allow the host to detect the supplied `Dockerfile`. Configure the start command through the container image; it is already `node dist/index.js`.

| Setting | Value |
|---|---|
| Build method | Dockerfile |
| Container port | `3000` (or platform-provided `PORT`) |
| Database | Managed MySQL/TiDB database recommended for production |
| Required secrets | `DATABASE_URL`, `JWT_SECRET`, and the OAuth/storage values listed in [`ENVIRONMENT.md`](./ENVIRONMENT.md) |
| GitHub OAuth (optional) | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

The Groq key is entered through the application’s API-key gate for each workspace; do not hard-code it in the repository or commit it to `.env`.

## Security notes

The terminal feature executes commands on the application server. Do **not** deploy this project as a public, shared service without adding strong user authentication, authorization, isolation, request logging, and command allow-listing. Keep repository credentials, OAuth secrets, database passwords, and API keys only in your host’s encrypted environment-variable settings.

The included authentication and storage helpers are configured for the Manus environment. For independent public hosting, configure compatible OAuth and storage providers before relying on those features for external users.

## Development commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install application dependencies |
| `pnpm dev` | Start the development server |
| `pnpm check` | Run TypeScript checks |
| `pnpm test` | Run tests |
| `pnpm build` | Build client and server assets |
| `pnpm start` | Run the built production server |

## Project layout

```text
client/       React application and workspace UI
server/       Express routes, tRPC procedures, storage, auth helpers
drizzle/      MySQL database schema and migrations
shared/       Shared constants and TypeScript types
```
