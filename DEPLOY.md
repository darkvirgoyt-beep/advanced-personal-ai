# Nova AI Deployment Checklist

Use this checklist after extracting the source ZIP or pushing the project to GitHub.

| Step | Action |
|---|---|
| 1 | Create a private GitHub repository and upload the extracted source files. Never upload an actual `.env` file. |
| 2 | Provision a MySQL-compatible database and record its connection URL. |
| 3 | Deploy with the included `Dockerfile` on a Node/Docker-capable host. Do not use GitHub Pages for this full-stack application. |
| 4 | Add environment variables listed in [`ENVIRONMENT.md`](./ENVIRONMENT.md) in the hosting dashboard. Use encrypted secrets rather than repository files. |
| 5 | Run the Drizzle database migration against the production database. |
| 6 | Configure OAuth callback URLs for the deployed domain if GitHub OAuth or the supplied OAuth integration is enabled. |
| 7 | Open the deployed URL, create/sign in to the workspace, and enter a Groq API key through the API-key gate. |

## Minimum production variables

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=LONG_RANDOM_SECRET
NODE_ENV=production
PORT=3000
```

## Important hosting consideration

The included terminal functionality can execute commands on the host. Only enable this application in an environment you control. For a public deployment, replace the terminal with a sandboxed task runner before allowing other people to sign in.
