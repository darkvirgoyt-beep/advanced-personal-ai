import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  hasGroqKey: vi.fn(),
  saveGroqKey: vi.fn(),
  clearGroqKeys: vi.fn(),
  getActiveGroqKey: vi.fn(),
  getChatHistory: vi.fn(),
  saveChatMessage: vi.fn(),
  clearChatHistory: vi.fn(),
  getAllSecrets: vi.fn(),
  getAllSecretValues: vi.fn(),
  saveSecret: vi.fn(),
  deleteSecret: vi.fn(),
  getCharts: vi.fn(),
  saveChart: vi.fn(),
  deleteChart: vi.fn(),
  getGitRepos: vi.fn(),
  saveGitRepo: vi.fn(),
  deleteGitRepo: vi.fn(),
  getGitHubAccessToken: vi.fn(),
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
  getCustomModels: vi.fn(),
  getActiveCustomModels: vi.fn(),
  saveCustomModel: vi.fn(),
  updateCustomModelApiKey: vi.fn(),
  toggleCustomModel: vi.fn(),
  deleteCustomModel: vi.fn(),
  getCustomTools: vi.fn(),
  saveCustomTool: vi.fn(),
  deleteCustomTool: vi.fn(),
  saveChatAttachment: vi.fn(),
}));

import * as db from "./db";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(db.getChatHistory).mockResolvedValue([]);
  vi.mocked(db.getAllSecretValues).mockResolvedValue([]);
  vi.mocked(db.getCustomTools).mockResolvedValue([]);
  vi.mocked(db.getActiveCustomModels).mockResolvedValue([]);
  vi.mocked(db.getGitHubAccessToken).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(user?: AuthenticatedUser | null): TrpcContext {
  return {
    user: user ?? undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

const testUser: AuthenticatedUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const anonymousWorkspaceUser: AuthenticatedUser = {
  ...testUser,
  id: 42,
  openId: "anon_browser_workspace",
  name: "Private workspace",
  loginMethod: "anonymous",
};

describe("groq key management", () => {
  it("returns has=false when no key exists", async () => {
    vi.mocked(db.hasGroqKey).mockResolvedValue(false);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.groq.check();
    expect(result).toEqual({ has: false });
  });

  it("keeps Groq-key state scoped to an anonymous browser workspace", async () => {
    vi.mocked(db.hasGroqKey).mockResolvedValue(false);
    const caller = appRouter.createCaller(createCtx(anonymousWorkspaceUser));
    await expect(caller.groq.check()).resolves.toEqual({ has: false });
    expect(db.hasGroqKey).toHaveBeenCalledWith(42);
  });

  it("rejects invalid API key format", async () => {
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.groq.save({ apiKey: "invalid_key" })).rejects.toThrow();
  });

  it("accepts valid gsk_ prefixed key", async () => {
    vi.mocked(db.saveGroqKey).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.groq.save({ apiKey: "gsk_test1234567890abcdefghijklmnop" });
    expect(result).toEqual({ success: true });
  });

  it("removes all saved Groq keys from the current workspace", async () => {
    vi.mocked(db.clearGroqKeys).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(anonymousWorkspaceUser));
    await expect(caller.groq.clear()).resolves.toEqual({ success: true });
    expect(db.clearGroqKeys).toHaveBeenCalledWith(42);
  });
});

describe("chat operations", () => {
  it("returns chat history", async () => {
    vi.mocked(db.getChatHistory).mockResolvedValue([
      { id: 1, role: "user", content: "hello" },
      { id: 2, role: "assistant", content: "hi!" },
    ]);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.chat.history({ sessionId: "test-session" });
    expect(result.messages).toHaveLength(2);
  });

  it("clears chat history", async () => {
    vi.mocked(db.clearChatHistory).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.chat.clear({ sessionId: "test-session" });
    expect(result).toEqual({ success: true });
  });

  it("throws when no API key configured", async () => {
    vi.mocked(db.getActiveGroqKey).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(
      caller.chat.send({ message: "hello", sessionId: "test" })
    ).rejects.toThrow();
  });

  it("routes a selected Kie AI custom model without exposing its API key to the client", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue({ model: "custom:7", systemPrompt: null });
    vi.mocked(db.getActiveGroqKey).mockResolvedValue(undefined);
    vi.mocked(db.getActiveCustomModels).mockResolvedValue([
      { id: 7, name: "Kie AI · Gemini 2.5 Flash", provider: "kie-ai", endpoint: "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions", apiKey: "kie-secret-key", modelName: "gemini-2.5-flash", isActive: "true" },
    ]);
    vi.mocked(db.saveChatMessage).mockResolvedValue(undefined);
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "Kie response" } }] }) }));
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.send({ message: "hello", sessionId: "kie-chat" })).resolves.toEqual({ message: "Kie response" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.kie.ai/gemini-2.5-flash/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer kie-secret-key" }),
    }));
  });

  it("adds selected repository context without exposing the GitHub OAuth token to the model prompt", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue(null);
    vi.mocked(db.getActiveGroqKey).mockResolvedValue("gsk_test1234567890abcdefghijklmnop");
    vi.mocked(db.getGitHubAccessToken).mockResolvedValue("github-token-should-stay-server-side");
    vi.mocked(db.saveChatMessage).mockResolvedValue(undefined);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/commits")) return { ok: true, status: 200, json: async () => [{ sha: "abc123456", commit: { message: "Fix rendering issue", author: { name: "Virgo" } } }] };
      if (url.includes("/readme")) return { ok: true, status: 200, text: async () => "# Nova repository\nUseful documentation." };
      if (url.includes("api.github.com/repos")) return { ok: true, status: 200, json: async () => ({ full_name: "darkvirgoyt-beep/nova", html_url: "https://github.com/darkvirgoyt-beep/nova", private: true, default_branch: "main", language: "TypeScript", description: "Nova source" }) };
      if (url === "https://api.groq.com/openai/v1/chat/completions") return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "Repository context received." } }] }) };
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.send({ message: "Review this project", sessionId: "repo-context", selectedRepoFullNames: ["darkvirgoyt-beep/nova"] })).resolves.toEqual({ message: "Repository context received." });
    const groqCall = fetchMock.mock.calls.find(([url]) => url === "https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(String(groqCall?.[1]?.body));
    expect(body.messages[0].content).toContain("[SELECTED GITHUB REPOSITORY CONTEXT]");
    expect(body.messages[0].content).toContain("darkvirgoyt-beep/nova");
    expect(body.messages[0].content).not.toContain("github-token-should-stay-server-side");
  });
});

describe("GitHub repository discovery", () => {
  it("returns a disconnected state without exposing a token when GitHub is not linked", async () => {
    const caller = appRouter.createCaller(createCtx(anonymousWorkspaceUser));
    await expect(caller.git.listGitHubRepos()).resolves.toEqual({ connected: false, repos: [] });
    expect(db.getGitHubAccessToken).toHaveBeenCalledWith(42);
  });

  it("lists GitHub repositories available to the current workspace", async () => {
    vi.mocked(db.getGitHubAccessToken).mockResolvedValue("server-only-token");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => [{ id: 7, name: "nova", full_name: "darkvirgoyt-beep/nova", description: "Nova source", private: true, default_branch: "main", html_url: "https://github.com/darkvirgoyt-beep/nova", language: "TypeScript", updated_at: "2026-08-14T00:00:00Z" }] })));
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.git.listGitHubRepos();
    expect(result).toMatchObject({ connected: true, repos: [{ fullName: "darkvirgoyt-beep/nova", private: true, defaultBranch: "main" }] });
    expect(JSON.stringify(result)).not.toContain("server-only-token");
  });
});

describe("vault operations", () => {
  it("lists secrets without values", async () => {
    vi.mocked(db.getAllSecrets).mockResolvedValue([
      { id: 1, name: "GITHUB_TOKEN", createdAt: new Date() },
    ]);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.vault.list();
    expect(result.secrets).toHaveLength(1);
    expect(result.secrets[0].name).toBe("GITHUB_TOKEN");
  });

  it("adds a secret", async () => {
    vi.mocked(db.saveSecret).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.vault.add({ name: "TEST", value: "secret123" });
    expect(result).toEqual({ success: true });
  });
});

describe("custom models operations", () => {
  it("publishes documented Kie AI chat-model presets without any user key", async () => {
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.models.kieChatPresets();
    expect(result.presets).toEqual(expect.arrayContaining([
      expect.objectContaining({ modelName: "gemini-2.5-flash", endpoint: "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions" }),
    ]));
    expect(JSON.stringify(result)).not.toContain("key");
  });

  it("lists custom models", async () => {
    vi.mocked(db.getCustomModels).mockResolvedValue([
      { id: 1, name: "GPT-4o", endpoint: "https://api.openai.com/v1/chat/completions", apiKey: "not-returned", isActive: "true" },
    ]);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.models.list();
    expect(result.models).toHaveLength(1);
    expect(result.models[0]).toMatchObject({ hasApiKey: true });
    expect(result.models[0]).not.toHaveProperty("apiKey");
  });

  it("adds a custom model", async () => {
    vi.mocked(db.saveCustomModel).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.models.add({
      name: "GPT-4o",
      endpoint: "https://api.openai.com/v1/chat/completions",
      modelName: "gpt-4o",
    });
    expect(result).toEqual({ success: true });
  });
  
  it("replaces or removes a custom model API key without returning it", async () => {
    vi.mocked(db.updateCustomModelApiKey).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.models.updateKey({ id: 7, apiKey: "custom-key" })).resolves.toEqual({ success: true });
    await expect(caller.models.clearKey({ id: 7 })).resolves.toEqual({ success: true });
    expect(db.updateCustomModelApiKey).toHaveBeenNthCalledWith(1, 1, 7, "custom-key");
    expect(db.updateCustomModelApiKey).toHaveBeenNthCalledWith(2, 1, 7, null);
  });
});

describe("custom tools operations", () => {
  it("lists custom tools", async () => {
    vi.mocked(db.getCustomTools).mockResolvedValue([
      { id: 1, name: "Code Reviewer", toolType: "system-instruction" },
    ]);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.tools.list();
    expect(result.tools).toHaveLength(1);
  });

  it("adds a custom tool", async () => {
    vi.mocked(db.saveCustomTool).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.tools.add({
      name: "Security Scanner",
      toolType: "code-analysis",
      systemInstruction: "Analyze code for security vulnerabilities",
    });
    expect(result).toEqual({ success: true });
  });
});

describe("settings operations", () => {
  it("returns null when no settings exist", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue(null);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.settings.get();
    expect(result).toBeNull();
  });

  it("updates settings", async () => {
    vi.mocked(db.updateUserSettings).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.settings.update({ model: "llama-3.3-70b-versatile" });
    expect(result).toEqual({ success: true });
  });
});

describe("Google OAuth configuration", () => {
  it("accepts the configured client credentials at Google’s token endpoint", async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "credential-validation-only",
        grant_type: "authorization_code",
        redirect_uri: "https://novaai-r2evuk7k.manus.space/api/auth/google/callback",
      }),
    });
    const body = await response.json() as { error?: string };
    expect(body.error).not.toBe("invalid_client");
  }, 20_000);
});

describe("GitHub OAuth configuration", () => {
  it("accepts the configured client credentials at GitHub’s token endpoint", async () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "credential-validation-only",
        redirect_uri: "https://novaai-r2evuk7k.manus.space/api/download/project-zip?github=1",
      }),
    });
    const body = await response.json() as { error?: string };
    expect(body.error).not.toBe("incorrect_client_credentials");
  }, 20_000);
});
