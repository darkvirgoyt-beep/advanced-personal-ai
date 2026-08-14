import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, mediumtext, longtext, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const groqKeys = mysqlTable("groq_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apiKey: varchar("apiKey", { length: 255 }).notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: longtext("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const secrets = mysqlTable("secrets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  value: mediumtext("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chartData = mysqlTable("chart_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  chartType: varchar("chartType", { length: 32 }).default("line").notNull(),
  data: longtext("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const githubOAuth = mysqlTable("github_oauth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  githubId: varchar("githubId", { length: 64 }),
  githubLogin: varchar("githubLogin", { length: 128 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  scope: varchar("scope", { length: 255 }),
  state: varchar("state", { length: 64 }).notNull().unique(),
  stateExpiry: int("stateExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const gitRepos = mysqlTable("git_repos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  remoteUrl: varchar("remoteUrl", { length: 512 }).notNull(),
  branch: varchar("branch", { length: 64 }).default("main").notNull(),
  username: varchar("username", { length: 128 }),
  token: varchar("token", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  model: varchar("model", { length: 128 }).default("llama-3.3-70b-versatile").notNull(),
  systemPrompt: mediumtext("systemPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const customModels = mysqlTable("custom_models", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).default("openai").notNull(),
  endpoint: varchar("endpoint", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 255 }),
  modelName: varchar("modelName", { length: 128 }).notNull(),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customTools = mysqlTable("custom_tools", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: mediumtext("description"),
  toolType: varchar("toolType", { length: 32 }).default("webhook").notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  systemInstruction: mediumtext("systemInstruction"),
  isActive: mysqlEnum("isActive", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatAttachments = mysqlTable("chat_attachments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messageId: int("messageId"),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileType: varchar("fileType", { length: 64 }).notNull(),
  fileSize: int("fileSize"),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * A user-owned code workspace. Source file bytes live in the configured storage
 * provider; this table holds only project metadata and the optional GitHub link.
 */
export const devProjects = mysqlTable("dev_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: varchar("description", { length: 512 }),
  githubRepoFullName: varchar("githubRepoFullName", { length: 256 }),
  runCommand: varchar("runCommand", { length: 512 }).default("npm run dev").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * File manifest for a project. Persisted source content is referenced through
 * storageKey rather than embedded in MySQL.
 */
export const devProjectFiles = mysqlTable("dev_project_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  path: varchar("path", { length: 512 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  size: int("size").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("dev_project_files_project_path_unique").on(table.projectId, table.path)]);

export type CustomModel = typeof customModels.$inferSelect;
export type InsertCustomModel = typeof customModels.$inferInsert;
export type CustomTool = typeof customTools.$inferSelect;
export type InsertCustomTool = typeof customTools.$inferInsert;
export type ChatAttachment = typeof chatAttachments.$inferSelect;
export type InsertChatAttachment = typeof chatAttachments.$inferInsert;
export type DevProject = typeof devProjects.$inferSelect;
export type InsertDevProject = typeof devProjects.$inferInsert;
export type DevProjectFile = typeof devProjectFiles.$inferSelect;
export type InsertDevProjectFile = typeof devProjectFiles.$inferInsert;
