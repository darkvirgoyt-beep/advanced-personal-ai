# Nova AI Environment Variables

> **Nova AI by VirgoYT** — configure these values as encrypted environment variables in a deployment provider or in a private local `.env` file. Start from [`config/self-host.env.template`](./config/self-host.env.template); never commit a real `.env` file.

```dotenv
# Database used for workspaces, chats, vault metadata, saved charts, tools, and models.
DATABASE_URL=mysql://nova_user:YOUR_DATABASE_PASSWORD@db:3306/nova_ai

# Long, high-entropy session signing secret.
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

# The public address of this deployment. It determines Google and GitHub callback URLs.
PUBLIC_APP_URL=https://ai.example.com

# Self-hosted uploads. Use local only with persistent disk or a mounted volume.
STORAGE_MODE=local
LOCAL_STORAGE_DIR=./data/uploads

# Optional Google login for independent hosting.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional GitHub repository connection for independent hosting.
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Only needed when deliberately using the managed Manus-compatible auth/storage integration.
VITE_APP_ID=YOUR_APP_ID
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=

NODE_ENV=production
PORT=3000
```

The Groq, Kie, and OpenRouter keys are deliberately not set here. Add them inside Nova AI per workspace so they are not committed to source control. For independent OAuth callbacks, register `https://YOUR_DOMAIN/api/auth/google/callback` with Google and `https://YOUR_DOMAIN/api/nova-github` with GitHub.
