import { exec } from "child_process";
import { promisify } from "util";
import { Express, Request, Response } from "express";
import { ZipArchive } from "archiver";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { randomBytes, timingSafeEqual } from "crypto";
import { parse as parseCookie } from "cookie";
import { storagePut } from "../storage";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { githubOAuth } from "../../drizzle/schema";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";

const execAsync = promisify(exec);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const GOOGLE_STATE_COOKIE = "nova_google_oauth_state";
const WORKSPACE_COOKIE = "nova_workspace";
const GOOGLE_CALLBACK_URL = "https://novaai-r2evuk7k.manus.space/api/auth/google/callback";
const GITHUB_CALLBACK_URL = "https://novaai-r2evuk7k.manus.space/api/download/project-zip?github=1";

function readCookie(req: Request, name: string): string | undefined {
  return parseCookie(req.headers.cookie ?? "")[name];
}

function validWorkspaceToken(value: string | undefined): value is string {
  return !!value && /^[a-zA-Z0-9_-]{16,64}$/.test(value);
}

function safeEquals(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

async function resolveWorkspaceUser(req: Request, res: Response) {
  try {
    const accountUser = await sdk.authenticateRequest(req);
    if (accountUser) return accountUser;
  } catch {
    // Direct anonymous workspaces are valid Nova AI sessions.
  }

  const existingToken = readCookie(req, WORKSPACE_COOKIE);
  const workspaceToken = validWorkspaceToken(existingToken)
    ? existingToken
    : randomBytes(24).toString("base64url");
  if (workspaceToken !== existingToken) {
    res.cookie(WORKSPACE_COOKIE, workspaceToken, {
      ...getSessionCookieOptions(req),
      maxAge: ONE_YEAR_MS,
    });
  }
  return db.getOrCreateAnonymousWorkspace(workspaceToken);
}

export function registerCustomRoutes(app: Express) {
  // Google OAuth remains optional. Users can always continue directly with a Groq key.
  app.get("/api/auth/google/authorize", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.redirect("/?error=google_not_configured");

    const state = randomBytes(24).toString("base64url");
    res.cookie(GOOGLE_STATE_COOKIE, state, {
      ...getSessionCookieOptions(req),
      maxAge: 10 * 60 * 1000,
    });

    const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", GOOGLE_CALLBACK_URL);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "openid email profile");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("prompt", "select_account");
    res.redirect(authorizeUrl.toString());
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const expectedState = readCookie(req, GOOGLE_STATE_COOKIE);
    res.clearCookie(GOOGLE_STATE_COOKIE, getSessionCookieOptions(req));

    if (!code || !safeEquals(state, expectedState)) {
      return res.redirect("/?error=google_auth_failed");
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: GOOGLE_CALLBACK_URL,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenResponse.json() as { access_token?: string };
      if (!tokenResponse.ok || !tokenData.access_token) throw new Error("Google token exchange failed");

      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileResponse.json() as { sub?: string; email?: string; name?: string };
      if (!profileResponse.ok || !profile.sub) throw new Error("Google profile lookup failed");

      const openId = `google_${profile.sub}`;
      const existingAccount = await db.getUserByOpenId(openId);
      await db.upsertUser({
        openId,
        name: profile.name || profile.email || "Google user",
        email: profile.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      const googleUser = await db.getUserByOpenId(openId);
      if (!googleUser) throw new Error("Google workspace creation failed");

      // Only migrate on first Google sign-in to avoid silently merging separate workspaces.
      const workspaceToken = readCookie(req, WORKSPACE_COOKIE);
      if (!existingAccount && validWorkspaceToken(workspaceToken)) {
        const anonymousUser = await db.getUserByOpenId(`anon_${workspaceToken}`);
        if (anonymousUser) await db.migrateAnonymousWorkspace(anonymousUser.id, googleUser.id);
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || "Google user",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      res.redirect("/chat?google_connected=true");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect("/?error=google_auth_failed");
    }
  });

  app.post("/api/terminal/execute", (req, res) => {
    const { command, profile } = req.body;
    if (!command || typeof command !== "string") {
      res.status(400).json({ error: "Invalid command" });
      return;
    }

    const workspaceProfile = ["ubuntu", "kali", "developer", "custom"].includes(profile)
      ? profile
      : "ubuntu";

    // Safety: block dangerous commands
    const blocked = ["rm -rf /", "mkfs", "dd if=", "shutdown", "reboot", "halt"];
    const lower = command.toLowerCase();
    if (blocked.some(b => lower.includes(b))) {
      res.status(403).json({ error: "Command blocked for safety" });
      return;
    }

    execAsync(command, { timeout: 30000, maxBuffer: 1024 * 1024 })
      .then(({ stdout, stderr }) => {
        res.json({ stdout: stdout || "", stderr: stderr || "", exitCode: 0, workspaceProfile, hostEnvironment: "Ubuntu Linux" });
      })
      .catch((err: any) => {
        res.json({
          stdout: err.stdout || "",
          stderr: err.stderr || "",
          exitCode: err.code || 1,
          killed: err.killed || false,
          workspaceProfile,
          hostEnvironment: "Ubuntu Linux",
        });
      });
  });

  // File upload endpoint - uploads to S3 storage
  app.post("/api/upload/file", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const file = req.file;
      const ext = path.extname(file.originalname) || "";
      const safeName = `${nanoid(8)}${ext}`;
      const { key, url } = await storagePut(
        `uploads/${safeName}`,
        file.buffer as Buffer,
        file.mimetype || "application/octet-stream"
      );

      res.json({
        success: true,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storageKey: key,
        url: url,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  const handleLiveGitHubOAuth = async (req: Request, res: Response) => {
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;

    if (action === "status") {
      try {
        const user = await resolveWorkspaceUser(req, res);
        const connection = await db.getGitHubConnection(user.id);
        return res.json({ connected: !!connection, login: connection?.githubLogin || "", scope: connection?.scope || "" });
      } catch {
        return res.json({ connected: false, login: "", scope: "" });
      }
    }

    if (code || state) {
      if (!code || !state) return res.redirect("/git?error=github_auth_failed");
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.redirect("/git?error=github_not_configured");
      try {
        const pendingAuthorization = await db.getGitHubAuthorizationState(state);
        if (!pendingAuthorization || !pendingAuthorization.stateExpiry || pendingAuthorization.stateExpiry < Math.floor(Date.now() / 1000)) {
          return res.redirect("/git?error=github_auth_expired");
        }
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: GITHUB_CALLBACK_URL }),
        });
        const tokenData = await tokenRes.json() as { access_token?: string; scope?: string };
        const accessToken = tokenData.access_token;
        if (!tokenRes.ok || !accessToken) return res.redirect("/git?error=github_auth_failed");
        const userRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
        });
        const ghUser = await userRes.json() as { id?: number; login?: string };
        if (!userRes.ok || !ghUser.id || !ghUser.login) return res.redirect("/git?error=github_profile_failed");
        await db.saveGitHubConnection(state, String(ghUser.id), ghUser.login, accessToken, tokenData.scope || "");
        return res.redirect("/git?github_connected=true");
      } catch (error) {
        console.error("[GitHub OAuth] Callback failed", error);
        return res.redirect("/git?error=github_auth_failed");
      }
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: "GitHub OAuth is not configured for this Nova AI deployment." });
    }
    try {
      const user = await resolveWorkspaceUser(req, res);
      const authorizationState = randomBytes(24).toString("base64url");
      await db.createGitHubAuthorizationState(user.id, authorizationState, Math.floor(Date.now() / 1000) + 600);
      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", clientId);
      authorizeUrl.searchParams.set("redirect_uri", GITHUB_CALLBACK_URL);
      authorizeUrl.searchParams.set("state", authorizationState);
      authorizeUrl.searchParams.set("scope", "repo read:user user:email");
      return res.redirect(authorizeUrl.toString());
    } catch (error) {
      console.error("[GitHub OAuth] Unable to start authorization", error);
      return res.status(500).json({ error: "Unable to start GitHub authorization. Please try again." });
    }
  };

  app.get("/api/download/project-zip", (req, res, next) => {
    if (req.query.github === "1") {
      void handleLiveGitHubOAuth(req, res);
      return;
    }
    next();
  });

  app.post("/api/download/project-zip", async (req, res) => {
    if (req.query.github !== "1" || req.query.action !== "disconnect") return res.status(400).json({ success: false });
    try {
      const user = await resolveWorkspaceUser(req, res);
      await db.clearGitHubConnection(user.id);
      return res.json({ success: true });
    } catch {
      return res.json({ success: false });
    }
  });

  app.get(["/api/download/project-zip", "/api/download/nova-ai-source.zip"], (_req, res) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const projectRoot = process.cwd();
    const sourceDirectories = ["client", "server", "shared", "drizzle"];
    const sourceFiles = [
      "ENVIRONMENT.md",
      ".gitignore",
      ".prettierignore",
      ".prettierrc",
      "Dockerfile",
      "docker-compose.yml",
      "DEPLOY.md",
      "README.md",
      "components.json",
      "drizzle.config.ts",
      "package.json",
      "pnpm-lock.yaml",
      "tsconfig.json",
      "vite.config.ts",
      "vitest.config.ts",
    ];

    res.setHeader("Content-Disposition", "attachment; filename=nova-ai-source.zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    archive.on("warning", (error: Error) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("[Project ZIP] Archive warning:", error);
      }
    });
    archive.on("error", (error: Error) => {
      console.error("[Project ZIP] Failed to create archive:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create source archive" });
      } else {
        res.end();
      }
    });
    archive.pipe(res);

    sourceDirectories.forEach(directory => {
      archive.directory(path.join(projectRoot, directory), directory);
    });
    sourceFiles.forEach(file => {
      archive.file(path.join(projectRoot, file), { name: file });
    });

    void archive.finalize();
  });

  // GitHub webhook handler for push notifications
  app.post("/api/github/webhook", (req, res) => {
    // Accept webhook payloads from GitHub
    res.json({ status: "ok" });
  });

  // GitHub OAuth uses a two-segment route because the production gateway only forwards that shape.
  app.get("/api/nova-github", async (req, res) => {
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;

    if (action === "status") {
      try {
        const user = await resolveWorkspaceUser(req, res);
        const connection = await db.getGitHubConnection(user.id);
        return res.json({ connected: !!connection, login: connection?.githubLogin || "", scope: connection?.scope || "" });
      } catch {
        return res.json({ connected: false, login: "", scope: "" });
      }
    }

    if (code || state) {
      if (!code || !state) return res.redirect("/git?error=github_auth_failed");
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.redirect("/git?error=github_not_configured");

      try {
        const pendingAuthorization = await db.getGitHubAuthorizationState(state);
        if (!pendingAuthorization || !pendingAuthorization.stateExpiry || pendingAuthorization.stateExpiry < Math.floor(Date.now() / 1000)) {
          return res.redirect("/git?error=github_auth_expired");
        }

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: GITHUB_CALLBACK_URL }),
        });
        const tokenData = await tokenRes.json() as { access_token?: string; scope?: string };
        const accessToken = tokenData.access_token;
        if (!tokenRes.ok || !accessToken) return res.redirect("/git?error=github_auth_failed");

        const userRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
        });
        const ghUser = await userRes.json() as { id?: number; login?: string };
        if (!userRes.ok || !ghUser.id || !ghUser.login) return res.redirect("/git?error=github_profile_failed");

        await db.saveGitHubConnection(state, String(ghUser.id), ghUser.login, accessToken, tokenData.scope || "");
        return res.redirect("/git?github_connected=true");
      } catch (error) {
        console.error("[GitHub OAuth] Callback failed", error);
        return res.redirect("/git?error=github_auth_failed");
      }
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: "GitHub OAuth is not configured for this Nova AI deployment." });
    }

    try {
      const user = await resolveWorkspaceUser(req, res);
      const authorizationState = randomBytes(24).toString("base64url");
      const expiry = Math.floor(Date.now() / 1000) + 600;
      await db.createGitHubAuthorizationState(user.id, authorizationState, expiry);

      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", clientId);
      authorizeUrl.searchParams.set("redirect_uri", GITHUB_CALLBACK_URL);
      authorizeUrl.searchParams.set("state", authorizationState);
      authorizeUrl.searchParams.set("scope", "repo read:user user:email");
      return res.redirect(authorizeUrl.toString());
    } catch (error) {
      console.error("[GitHub OAuth] Unable to start authorization", error);
      return res.status(500).json({ error: "Unable to start GitHub authorization. Please try again." });
    }
  });

  app.post("/api/nova-github", async (req, res) => {
    if (req.query.action !== "disconnect") return res.status(400).json({ success: false });
    try {
      const user = await resolveWorkspaceUser(req, res);
      await db.clearGitHubConnection(user.id);
      return res.json({ success: true });
    } catch {
      return res.json({ success: false });
    }
  });
}
