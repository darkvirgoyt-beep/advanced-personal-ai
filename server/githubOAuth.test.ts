import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type Connection = { githubLogin: string; scope: string };

const connections = new Map<number, Connection>();
const pendingStates = new Map<string, { userId: number; stateExpiry: number }>();
const workspaceIds = new Map([
  ["workspace_alpha_123456", 101],
  ["workspace_beta_1234567", 202],
]);

vi.mock("./db", () => ({
  getOrCreateAnonymousWorkspace: vi.fn(async (token: string) => ({ id: workspaceIds.get(token) ?? 999, openId: `anon_${token}` })),
  createGitHubAuthorizationState: vi.fn(async (userId: number, state: string, stateExpiry: number) => {
    pendingStates.set(state, { userId, stateExpiry });
  }),
  getGitHubAuthorizationState: vi.fn(async (state: string) => pendingStates.get(state)),
  saveGitHubConnection: vi.fn(async (state: string, _githubId: string, githubLogin: string, _accessToken: string, scope: string) => {
    const pending = pendingStates.get(state);
    if (pending) connections.set(pending.userId, { githubLogin, scope });
  }),
  getGitHubConnection: vi.fn(async (userId: number) => connections.get(userId)),
  clearGitHubConnection: vi.fn(async (userId: number) => { connections.delete(userId); }),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  migrateAnonymousWorkspace: vi.fn(),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn() }));
vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: vi.fn(async () => { throw new Error("anonymous workspace"); }) },
}));

const { registerCustomRoutes } = await import("./routes/terminal");

let server: Server;
let baseUrl = "";
const nodeFetch = globalThis.fetch;

function workspaceCookie(token: string) {
  return `nova_workspace=${token}`;
}

async function api(path: string, token: string, init?: RequestInit) {
  return nodeFetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init,
    headers: { cookie: workspaceCookie(token), ...(init?.headers || {}) },
  });
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerCustomRoutes(app);
  server = await new Promise<Server>(resolve => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

describe("GitHub OAuth workspace isolation", () => {
  const alpha = "workspace_alpha_123456";
  const beta = "workspace_beta_1234567";

  it("returns connection status only for the workspace that owns the connection", async () => {
    connections.clear();
    connections.set(101, { githubLogin: "alpha-user", scope: "repo" });

    const alphaResponse = await api("/api/nova-github?action=status", alpha);
    const betaResponse = await api("/api/nova-github?action=status", beta);

    expect(await alphaResponse.json()).toMatchObject({ connected: true, login: "alpha-user" });
    expect(await betaResponse.json()).toMatchObject({ connected: false, login: "" });
  });

  it("disconnects only the current workspace while preserving other workspaces", async () => {
    connections.clear();
    connections.set(101, { githubLogin: "alpha-user", scope: "repo" });
    connections.set(202, { githubLogin: "beta-user", scope: "repo" });

    const disconnectResponse = await api("/api/nova-github?action=disconnect", alpha, { method: "POST" });
    expect(await disconnectResponse.json()).toEqual({ success: true });

    const alphaResponse = await api("/api/nova-github?action=status", alpha);
    const betaResponse = await api("/api/nova-github?action=status", beta);
    expect(await alphaResponse.json()).toMatchObject({ connected: false, login: "" });
    expect(await betaResponse.json()).toMatchObject({ connected: true, login: "beta-user" });
  });

  it("links a successful callback to the originating anonymous workspace and exposes the linked login", async () => {
    connections.clear();
    pendingStates.clear();
    pendingStates.set("pending-alpha", { userId: 101, stateExpiry: Math.floor(Date.now() / 1000) + 600 });

    const originalFetch = globalThis.fetch;
    const githubFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "test-token", scope: "repo" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 42, login: "alpha-user" }) });
    vi.stubGlobal("fetch", githubFetch);

    try {
      const callbackResponse = await api("/api/nova-github?code=real-code&state=pending-alpha", alpha);
      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.get("location")).toBe("/git?github_connected=true");
    } finally {
      vi.stubGlobal("fetch", originalFetch);
    }

    const statusResponse = await api("/api/nova-github?action=status", alpha);
    expect(await statusResponse.json()).toMatchObject({ connected: true, login: "alpha-user" });
  });
});
