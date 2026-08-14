import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, mediumtext, longtext } from "drizzle-orm/mysql-core";

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
