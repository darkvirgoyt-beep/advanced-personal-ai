import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  hasGroqKey: vi.fn(),
  saveGroqKey: vi.fn(),
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
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
  getCustomModels: vi.fn(),
  saveCustomModel: vi.fn(),
  toggleCustomModel: vi.fn(),
  deleteCustomModel: vi.fn(),
  getCustomTools: vi.fn(),
  saveCustomTool: vi.fn(),
  deleteCustomTool: vi.fn(),
  saveChatAttachment: vi.fn(),
}));

import * as db from "./db";

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

describe("groq key management", () => {
  it("returns has=false when no key exists", async () => {
    vi.mocked(db.hasGroqKey).mockResolvedValue(false);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.groq.check();
    expect(result).toEqual({ has: false });
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
  it("lists custom models", async () => {
    vi.mocked(db.getCustomModels).mockResolvedValue([
      { id: 1, name: "GPT-4o", endpoint: "https://api.openai.com/v1/chat/completions", isActive: "true" },
    ]);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.models.list();
    expect(result.models).toHaveLength(1);
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
