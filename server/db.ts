import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, groqKeys, chatMessages, secrets,
  chartData, gitRepos, settings,
  customModels, customTools, chatAttachments, githubOAuth, devProjects, devProjectFiles
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) { console.warn("[Database] DB not available"); return; }
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn || new Date() };
  const updateSet: Record<string, unknown> = {};
  for (const f of ["name", "email", "loginMethod"] as const) {
    if (user[f] !== undefined) { values[f] = user[f]; updateSet[f] = user[f]; }
  }
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Resolves the database user for an opaque browser workspace token. The token
 * is held only in an HTTP-only cookie, so all saved data remains scoped to
 * the same browser without requiring an account sign-in.
 */
export async function getOrCreateAnonymousWorkspace(workspaceToken: string) {
  const openId = `anon_${workspaceToken}`;
  const existing = await getUserByOpenId(openId);
  if (existing) return existing;

  await upsertUser({
    openId,
    name: "Private workspace",
    loginMethod: "anonymous",
    role: "user",
    lastSignedIn: new Date(),
  });

  const created = await getUserByOpenId(openId);
  if (!created) throw new Error("Unable to initialize private workspace");
  return created;
}

export async function migrateAnonymousWorkspace(anonymousUserId: number, accountUserId: number): Promise<void> {
  if (anonymousUserId === accountUserId) return;
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  await db.transaction(async tx => {
    await tx.update(groqKeys).set({ userId: accountUserId }).where(eq(groqKeys.userId, anonymousUserId));
    await tx.update(chatMessages).set({ userId: accountUserId }).where(eq(chatMessages.userId, anonymousUserId));
    await tx.update(secrets).set({ userId: accountUserId }).where(eq(secrets.userId, anonymousUserId));
    await tx.update(chartData).set({ userId: accountUserId }).where(eq(chartData.userId, anonymousUserId));
    await tx.update(gitRepos).set({ userId: accountUserId }).where(eq(gitRepos.userId, anonymousUserId));
    await tx.update(settings).set({ userId: accountUserId }).where(eq(settings.userId, anonymousUserId));
    await tx.update(customModels).set({ userId: accountUserId }).where(eq(customModels.userId, anonymousUserId));
    await tx.update(customTools).set({ userId: accountUserId }).where(eq(customTools.userId, anonymousUserId));
    await tx.update(chatAttachments).set({ userId: accountUserId }).where(eq(chatAttachments.userId, anonymousUserId));
    await tx.update(githubOAuth).set({ userId: accountUserId }).where(eq(githubOAuth.userId, anonymousUserId));
    await tx.update(devProjects).set({ userId: accountUserId }).where(eq(devProjects.userId, anonymousUserId));
    await tx.update(devProjectFiles).set({ userId: accountUserId }).where(eq(devProjectFiles.userId, anonymousUserId));
  });
}

export async function createGitHubAuthorizationState(userId: number, state: string, stateExpiry: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(githubOAuth).values({ userId, state, stateExpiry });
}

export async function getGitHubAuthorizationState(state: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(githubOAuth).where(eq(githubOAuth.state, state)).limit(1);
  return result[0];
}

export async function saveGitHubConnection(
  state: string,
  githubId: string,
  githubLogin: string,
  accessToken: string,
  scope: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(githubOAuth)
    .set({ githubId, githubLogin, accessToken, scope, stateExpiry: null })
    .where(eq(githubOAuth.state, state));
}

export async function getGitHubConnection(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ githubLogin: githubOAuth.githubLogin, scope: githubOAuth.scope })
    .from(githubOAuth)
    .where(and(eq(githubOAuth.userId, userId), sql`${githubOAuth.accessToken} IS NOT NULL`))
    .orderBy(desc(githubOAuth.id))
    .limit(1);
  return result[0];
}

/**
 * Returns an OAuth token only to server-side callers. Never expose this value
 * through a tRPC response or client-visible route.
 */
export async function getGitHubAccessToken(userId: number): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ accessToken: githubOAuth.accessToken })
    .from(githubOAuth)
    .where(and(eq(githubOAuth.userId, userId), sql`${githubOAuth.accessToken} IS NOT NULL`))
    .orderBy(desc(githubOAuth.id))
    .limit(1);
  return result[0]?.accessToken || undefined;
}

export async function clearGitHubConnection(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(githubOAuth)
    .set({ accessToken: null, githubLogin: null, githubId: null, scope: null })
    .where(eq(githubOAuth.userId, userId));
}

// ── Groq Keys ──
export async function saveGroqKey(userId: number, apiKey: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Deactivate old keys, store new
  await db.update(groqKeys).set({ isActive: 'false' }).where(eq(groqKeys.userId, userId));
  await db.insert(groqKeys).values({ userId, apiKey, isActive: 'true' });
}

export async function getActiveGroqKey(userId: number): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select()
    .from(groqKeys)
    .where(and(eq(groqKeys.userId, userId), eq(groqKeys.isActive, 'true')))
    .limit(1);
  return result[0]?.apiKey;
}

export async function hasGroqKey(userId: number): Promise<boolean> {
  const key = await getActiveGroqKey(userId);
  return !!key;
}

export async function clearGroqKeys(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(groqKeys).where(eq(groqKeys.userId, userId));
}

// ── Chat Messages ──
export async function saveChatMessage(userId: number, sessionId: string, role: string, content: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(chatMessages).values({ userId, sessionId, role: role as any, content });
}

export async function getChatHistory(userId: number, sessionId: string, limit = 100): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), eq(chatMessages.sessionId, sessionId)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .then(rows => rows.reverse());
}

export async function clearChatHistory(userId: number, sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(chatMessages)
    .where(and(eq(chatMessages.userId, userId), eq(chatMessages.sessionId, sessionId)));
}

// ── Secrets ──
export async function saveSecret(userId: number, name: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(secrets).values({ userId, name, value });
}

export async function getAllSecrets(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(secrets).where(eq(secrets.userId, userId));
}

export async function getAllSecretValues(userId: number): Promise<{ name: string; value: string }[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select({ name: secrets.name, value: secrets.value })
    .from(secrets)
    .where(eq(secrets.userId, userId));
}

export async function deleteSecret(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(secrets).where(and(eq(secrets.userId, userId), eq(secrets.id, id)));
}

// ── Charts ──
export async function saveChart(userId: number, name: string, chartDataJson: string, chartType: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(chartData).values({ userId, name, chartType, data: chartDataJson });
}

export async function getCharts(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chartData).where(eq(chartData.userId, userId)).orderBy(desc(chartData.createdAt));
}

export async function deleteChart(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(chartData).where(and(eq(chartData.userId, userId), eq(chartData.id, id)));
}

// ── Git Repos ──
export async function saveGitRepo(userId: number, name: string, remoteUrl: string, branch: string, username?: string, token?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gitRepos).values({ userId, name, remoteUrl, branch, username, token });
}

export async function getGitRepos(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gitRepos).where(eq(gitRepos.userId, userId));
}

export async function deleteGitRepo(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(gitRepos).where(and(eq(gitRepos.userId, userId), eq(gitRepos.id, id)));
}

// ── Settings ──
export async function getUserSettings(userId: number): Promise<any> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function updateUserSettings(userId: number, model?: string, systemPrompt?: string, aiMode?: string, memoryEnabled?: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getUserSettings(userId);
  if (existing) {
    await db.update(settings)
      .set({
        ...(model !== undefined ? { model } : {}),
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(aiMode !== undefined ? { aiMode } : {}),
        ...(memoryEnabled !== undefined ? { memoryEnabled } : {}),
      })
      .where(eq(settings.userId, userId));
  } else {
    await db.insert(settings).values({ userId, model: model || 'llama-3.3-70b-versatile', systemPrompt: systemPrompt || null, aiMode: aiMode || 'fast', memoryEnabled: memoryEnabled ?? true });
  }
}

// ── Custom Models ──
export async function saveCustomModel(userId: number, name: string, provider: string, endpoint: string, apiKey: string | null, modelName: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(customModels).values({ userId, name, provider, endpoint, apiKey, modelName, isActive: 'true' });
}

export async function getCustomModels(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customModels).where(eq(customModels.userId, userId));
}

export async function getActiveCustomModels(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customModels).where(and(eq(customModels.userId, userId), eq(customModels.isActive, 'true')));
}

export async function deleteCustomModel(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(customModels).where(and(eq(customModels.userId, userId), eq(customModels.id, id)));
}

export async function toggleCustomModel(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const model = await db.select().from(customModels).where(and(eq(customModels.userId, userId), eq(customModels.id, id))).limit(1);
  if (model[0]) {
    const newStatus = model[0].isActive === 'true' ? 'false' : 'true';
    await db.update(customModels).set({ isActive: newStatus as any }).where(eq(customModels.id, id));
  }
}

export async function updateCustomModelApiKey(userId: number, id: number, apiKey: string | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(customModels)
    .set({ apiKey })
    .where(and(eq(customModels.userId, userId), eq(customModels.id, id)));
}

// ── Custom Tools ──
export async function saveCustomTool(userId: number, name: string, description: string | null, toolType: string, endpoint: string | null, systemInstruction: string | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(customTools).values({ userId, name, description, toolType, endpoint, systemInstruction, isActive: 'true' });
}

export async function getCustomTools(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customTools).where(eq(customTools.userId, userId));
}

export async function deleteCustomTool(userId: number, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(customTools).where(and(eq(customTools.userId, userId), eq(customTools.id, id)));
}

// ── Chat Attachments ──
export async function saveChatAttachment(userId: number, messageId: number | null, fileName: string, fileType: string, fileSize: number | null, storageKey: string, url: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(chatAttachments).values({ userId, messageId, fileName, fileType, fileSize, storageKey, url });
}

export async function getAttachmentsByMessageId(userId: number, messageId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatAttachments).where(and(eq(chatAttachments.userId, userId), eq(chatAttachments.messageId, messageId)));
}

// ── Developer Projects ──
export async function listDevProjects(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devProjects).where(eq(devProjects.userId, userId)).orderBy(desc(devProjects.updatedAt));
}

export async function getDevProject(userId: number, projectId: number): Promise<any | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devProjects)
    .where(and(eq(devProjects.userId, userId), eq(devProjects.id, projectId)))
    .limit(1);
  return result[0];
}

export async function createDevProject(userId: number, name: string, description?: string, githubRepoFullName?: string, runCommand?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(devProjects).values({
    userId,
    name,
    description: description || null,
    githubRepoFullName: githubRepoFullName || null,
    runCommand: runCommand || "npm run dev",
  });
  return Number(result[0].insertId);
}

export async function updateDevProject(userId: number, projectId: number, input: { name?: string; description?: string | null; githubRepoFullName?: string | null; runCommand?: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(devProjects).set({
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.githubRepoFullName !== undefined ? { githubRepoFullName: input.githubRepoFullName } : {}),
    ...(input.runCommand !== undefined ? { runCommand: input.runCommand } : {}),
    updatedAt: new Date(),
  }).where(and(eq(devProjects.userId, userId), eq(devProjects.id, projectId)));
}

export async function deleteDevProject(userId: number, projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.transaction(async tx => {
    await tx.delete(devProjectFiles).where(and(eq(devProjectFiles.userId, userId), eq(devProjectFiles.projectId, projectId)));
    await tx.delete(devProjects).where(and(eq(devProjects.userId, userId), eq(devProjects.id, projectId)));
  });
}

export async function listDevProjectFiles(userId: number, projectId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: devProjectFiles.id,
    path: devProjectFiles.path,
    size: devProjectFiles.size,
    updatedAt: devProjectFiles.updatedAt,
    createdAt: devProjectFiles.createdAt,
  }).from(devProjectFiles)
    .where(and(eq(devProjectFiles.userId, userId), eq(devProjectFiles.projectId, projectId)))
    .orderBy(devProjectFiles.path);
}

/** Server-only file manifest used to materialize a project for a bounded run. */
export async function getDevProjectFilesForRun(userId: number, projectId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devProjectFiles)
    .where(and(eq(devProjectFiles.userId, userId), eq(devProjectFiles.projectId, projectId)))
    .orderBy(devProjectFiles.path);
}

export async function getDevProjectFile(userId: number, projectId: number, filePath: string): Promise<any | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devProjectFiles)
    .where(and(
      eq(devProjectFiles.userId, userId),
      eq(devProjectFiles.projectId, projectId),
      eq(devProjectFiles.path, filePath),
    ))
    .limit(1);
  return result[0];
}

export async function saveDevProjectFile(userId: number, projectId: number, filePath: string, storageKey: string, size: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(devProjectFiles).values({ userId, projectId, path: filePath, storageKey, size })
    .onDuplicateKeyUpdate({ set: { storageKey, size, updatedAt: new Date() } });
  await db.update(devProjects).set({ updatedAt: new Date() })
    .where(and(eq(devProjects.userId, userId), eq(devProjects.id, projectId)));
}

export async function deleteDevProjectFile(userId: number, projectId: number, filePath: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(devProjectFiles).where(and(
    eq(devProjectFiles.userId, userId),
    eq(devProjectFiles.projectId, projectId),
    eq(devProjectFiles.path, filePath),
  ));
  await db.update(devProjects).set({ updatedAt: new Date() })
    .where(and(eq(devProjects.userId, userId), eq(devProjects.id, projectId)));
}
