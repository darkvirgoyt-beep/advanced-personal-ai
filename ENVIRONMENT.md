# Nova AI Environment Variables

Configure these values as encrypted environment variables in your deployment provider. For local Docker deployment, create a private `.env` file from this template; do not commit it.

```dotenv
# Database used for users, chats, vault metadata, saved charts, tools, and models.
DATABASE_URL=mysql://nova_user:YOUR_DATABASE_PASSWORD@db:3306/nova_ai

# Long, high-entropy session signing secret.
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET

# Required by the Manus OAuth and storage integration shipped with this source.
VITE_APP_ID=YOUR_APP_ID
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=

# Optional: enables the in-app GitHub OAuth connection button.
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

NODE_ENV=production
PORT=3000
```

The Groq key is deliberately not set here. Enter it after sign-in through Nova AI's API-key gate so it is not committed to your repository.
