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
  importChatConversation: vi.fn(),
  deleteChatConversation: vi.fn(),
  ensureChatConversation: vi.fn(),
  listChatConversations: vi.fn(),
  searchChatConversationSessionIds: vi.fn(),
  listChatFolders: vi.fn(),
  createChatFolder: vi.fn(),
  deleteChatFolder: vi.fn(),
  updateChatConversationFolder: vi.fn(),
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
  getDevProject: vi.fn(),
  listDevProjectFiles: vi.fn(),
  createDevProject: vi.fn(),
  updateDevProject: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
  storageReadText: vi.fn(),
}));

vi.mock("./_core/imageGeneration", () => ({ generateImage: vi.fn() }));
vi.mock("./_core/voiceTranscription", () => ({ transcribeAudio: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import * as db from "./db";
import * as storage from "./storage";
import * as imageGeneration from "./_core/imageGeneration";
import * as voiceTranscription from "./_core/voiceTranscription";
import * as llm from "./_core/llm";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(db.getChatHistory).mockResolvedValue([]);
  vi.mocked(db.listChatConversations).mockResolvedValue([]);
  vi.mocked(db.searchChatConversationSessionIds).mockResolvedValue([]);
  vi.mocked(db.listChatFolders).mockResolvedValue([]);
  vi.mocked(db.getAllSecretValues).mockResolvedValue([]);
  vi.mocked(db.getCustomTools).mockResolvedValue([]);
  vi.mocked(db.getActiveCustomModels).mockResolvedValue([]);
  vi.mocked(db.getGitHubAccessToken).mockResolvedValue(undefined);
  vi.mocked(db.getDevProject).mockResolvedValue(undefined);
  vi.mocked(db.listDevProjectFiles).mockResolvedValue([]);
  vi.mocked(db.createDevProject).mockResolvedValue(1);
  vi.mocked(storage.storageReadText).mockResolvedValue("");
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

describe("creator services", () => {
  it("generates an image server-side without exposing integration credentials", async () => {
    vi.mocked(imageGeneration.generateImage).mockResolvedValue({ url: "https://storage.example/generated/nova.png" });
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.creator.generateImage({ prompt: "A violet NovaAI dashboard with orbiting stars", quality: "medium" })).resolves.toEqual({ url: "https://storage.example/generated/nova.png" });
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({ prompt: "A violet NovaAI dashboard with orbiting stars", quality: "medium" });
  });

  it("transcribes a public HTTPS upload and rejects unsafe internal URLs", async () => {
    vi.mocked(voiceTranscription.transcribeAudio).mockResolvedValue({ task: "transcribe", language: "en", duration: 1.2, text: "Draft a release plan", segments: [] });
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.voice.transcribe({ audioUrl: "https://storage.example/audio.webm", language: "en" })).resolves.toMatchObject({ text: "Draft a release plan", language: "en" });
    await expect(caller.voice.transcribe({ audioUrl: "http://127.0.0.1/private.webm" })).rejects.toThrow("Use an HTTPS audio file uploaded through NovaAI");
  });

  it("analyzes a safe uploaded image with the server-side vision model", async () => {
    vi.mocked(llm.invokeLLM).mockResolvedValue({ choices: [{ message: { role: "assistant", content: "The screenshot shows a settings panel." } }] } as any);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.creator.analyzeImage({ imageUrl: "https://storage.example/screen.png" })).resolves.toEqual({ analysis: "The screenshot shows a settings panel." });
    expect(llm.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ role: "user" })]) }));
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
    vi.mocked(db.deleteChatConversation).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.chat.clear({ sessionId: "test-session" });
    expect(result).toEqual({ success: true });
    expect(db.deleteChatConversation).toHaveBeenCalledWith(1, "test-session");
  });

  it("exports only the selected workspace conversation in a portable JSON shape", async () => {
    vi.mocked(db.getChatHistory).mockResolvedValue([{ id: 3, role: "user", content: "Keep this private" }] as any);
    vi.mocked(db.listChatConversations).mockResolvedValue([{ sessionId: "private-chat", title: "Private plan", folderId: null, updatedAt: new Date() }] as any);
    const caller = appRouter.createCaller(createCtx(anonymousWorkspaceUser));
    await expect(caller.chat.exportConversation({ sessionId: "private-chat" })).resolves.toMatchObject({
      format: "novaai-conversation/v1",
      title: "Private plan",
      messages: [{ role: "user", content: "Keep this private" }],
    });
    expect(db.getChatHistory).toHaveBeenCalledWith(42, "private-chat", 300);
  });

  it("imports a validated conversation into a new current-workspace session", async () => {
    vi.mocked(db.importChatConversation).mockResolvedValue("imported-session");
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.importConversation({
      format: "novaai-conversation/v1",
      title: "Imported plan",
      messages: [{ role: "user", content: "Summarize this plan" }, { role: "assistant", content: "Here is the summary" }],
    })).resolves.toEqual({ sessionId: "imported-session" });
    expect(db.importChatConversation).toHaveBeenCalledWith(1, "Imported plan", expect.any(Array));
    await expect(caller.chat.importConversation({ format: "novaai-conversation/v1", messages: [] })).rejects.toThrow();
  });

  it("searches only the current workspace's conversation titles", async () => {
    vi.mocked(db.listChatConversations).mockResolvedValue([
      { sessionId: "design", title: "Design a portfolio", folderId: null, updatedAt: new Date() },
      { sessionId: "code", title: "Fix TypeScript build", folderId: 2, updatedAt: new Date() },
    ]);
    vi.mocked(db.searchChatConversationSessionIds).mockResolvedValue(["design"]);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.conversations({ search: "portfolio" })).resolves.toMatchObject({
      conversations: [{ sessionId: "design", title: "Design a portfolio" }],
    });
    expect(db.listChatConversations).toHaveBeenCalledWith(1);
    expect(db.searchChatConversationSessionIds).toHaveBeenCalledWith(1, "portfolio");
  });

  it("finds a conversation when the query matches saved content rather than its title", async () => {
    vi.mocked(db.listChatConversations).mockResolvedValue([
      { sessionId: "design", title: "Project planning", folderId: null, updatedAt: new Date() },
    ]);
    vi.mocked(db.searchChatConversationSessionIds).mockResolvedValue(["design"]);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.conversations({ search: "wireframe" })).resolves.toMatchObject({
      conversations: [{ sessionId: "design", title: "Project planning" }],
    });
  });

  it("creates folders and moves conversations within the current workspace", async () => {
    vi.mocked(db.createChatFolder).mockResolvedValue(undefined);
    vi.mocked(db.updateChatConversationFolder).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.createFolder({ name: "Client work" })).resolves.toEqual({ success: true });
    await expect(caller.chat.moveConversation({ sessionId: "design", folderId: 7 })).resolves.toEqual({ success: true });
    expect(db.createChatFolder).toHaveBeenCalledWith(1, "Client work");
    expect(db.updateChatConversationFolder).toHaveBeenCalledWith(1, "design", 7);
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

  it("routes a selected OpenRouter Neutron 3 Ultra model through the documented chat endpoint", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue({ model: "custom:8", systemPrompt: null });
    vi.mocked(db.getActiveGroqKey).mockResolvedValue(undefined);
    vi.mocked(db.getActiveCustomModels).mockResolvedValue([
      { id: 8, name: "OpenRouter · NVIDIA Nemotron 3 Ultra", provider: "openrouter", endpoint: "https://openrouter.ai/api/v1/chat/completions", apiKey: "openrouter-secret-key", modelName: "nvidia/nemotron-3-ultra-550b-a55b", isActive: "true" },
    ]);
    vi.mocked(db.saveChatMessage).mockResolvedValue(undefined);
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "Neutron response" } }] }) }));
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.send({ message: "Solve this coding task", sessionId: "neutron-chat" })).resolves.toEqual({ message: "Neutron response" });
    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer openrouter-secret-key" }),
      body: expect.stringContaining("nvidia/nemotron-3-ultra-550b-a55b"),
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

  it("adds an owned active development project and open-file excerpt to AI context", async () => {
    vi.mocked(db.getUserSettings).mockResolvedValue(null);
    vi.mocked(db.getActiveGroqKey).mockResolvedValue("gsk_test1234567890abcdefghijklmnop");
    vi.mocked(db.getDevProject).mockResolvedValue({ id: 11, userId: 1, name: "Portfolio site", description: "Personal website", githubRepoFullName: "VirgoYT/portfolio", runCommand: "npm run dev" } as any);
    vi.mocked(db.listDevProjectFiles).mockResolvedValue([{ id: 1, projectId: 11, path: "src/app.ts", storageKey: "dev-projects/1/11/src/app.ts", size: 42, updatedAt: new Date() }] as any);
    vi.mocked(storage.storageReadText).mockResolvedValue("export const greeting = 'hello';");
    vi.mocked(db.getGitHubAccessToken).mockResolvedValue("server-only-github-token");
    vi.mocked(db.saveChatMessage).mockResolvedValue(undefined);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/commits")) return { ok: true, status: 200, json: async () => [{ sha: "abc123456", commit: { message: "Build landing page", author: { name: "VirgoYT" } } }] };
      if (url.includes("/readme")) return { ok: true, status: 200, text: async () => "# Portfolio\nProject documentation." };
      if (url.includes("api.github.com/repos")) return { ok: true, status: 200, json: async () => ({ full_name: "VirgoYT/portfolio", html_url: "https://github.com/VirgoYT/portfolio", private: true, default_branch: "main", language: "TypeScript", description: "Portfolio source" }) };
      if (url === "https://api.groq.com/openai/v1/chat/completions") return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "Project context received." } }] }) };
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.chat.send({ message: "Review this file", sessionId: "project-context", activeProjectId: 11, activeProjectPath: "src/app.ts" })).resolves.toEqual({ message: "Project context received." });
    const groqCall = fetchMock.mock.calls.find(([url]) => url === "https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(String(groqCall?.[1]?.body));
    expect(body.messages[0].content).toContain("[ACTIVE NOVA DEVELOPMENT PROJECT]");
    expect(body.messages[0].content).toContain("Portfolio site");
    expect(body.messages[0].content).toContain("OPEN EDITOR FILE: src/app.ts");
    expect(body.messages[0].content).toContain("export const greeting = 'hello';");
    expect(body.messages[0].content).toContain("[SELECTED GITHUB REPOSITORY CONTEXT]");
    expect(body.messages[0].content).toContain("Build landing page");
    expect(body.messages[0].content).not.toContain("server-only-github-token");
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

  it("links a development project only to a repository exposed by its current GitHub connection", async () => {
    vi.mocked(db.getGitHubAccessToken).mockResolvedValue("server-only-token");
    vi.mocked(db.createDevProject).mockResolvedValue(15);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => [{ id: 8, name: "portfolio", full_name: "VirgoYT/portfolio", private: true, default_branch: "main", html_url: "https://github.com/VirgoYT/portfolio", language: "TypeScript", updated_at: "2026-08-14T00:00:00Z" }] })));
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.projects.create({ name: "Portfolio", githubRepoFullName: "VirgoYT/portfolio" })).resolves.toEqual({ id: 15 });
    expect(db.createDevProject).toHaveBeenCalledWith(1, "Portfolio", undefined, "VirgoYT/portfolio", undefined);
  });

  it("rejects project links to repositories unavailable from the current GitHub connection", async () => {
    vi.mocked(db.getGitHubAccessToken).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createCtx(testUser));
    await expect(caller.projects.create({ name: "Private", githubRepoFullName: "other/private" })).rejects.toThrow("Connect GitHub");
    expect(db.createDevProject).not.toHaveBeenCalled();
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
  it("publishes the documented OpenRouter Neutron 3 Ultra preset without any user key", async () => {
    const caller = appRouter.createCaller(createCtx(testUser));
    const result = await caller.models.openRouterChatPresets();
    expect(result.presets).toEqual(expect.arrayContaining([
      expect.objectContaining({ modelName: "nvidia/nemotron-3-ultra-550b-a55b", endpoint: "https://openrouter.ai/api/v1/chat/completions" }),
    ]));
    expect(JSON.stringify(result)).not.toContain("key");
  });

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
