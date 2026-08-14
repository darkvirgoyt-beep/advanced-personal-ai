import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  listConversationsForUser: vi.fn(),
  listConversationMessages: vi.fn(),
}));

vi.mock("./db", () => db);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `operator-${userId}`,
      name: "Nova Operator",
      email: "operator@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("chat router ownership boundary", () => {
  it("uses the authenticated user id when retrieving a conversation’s messages", async () => {
    db.listConversationMessages.mockResolvedValue({
      conversation: { id: "conversation-123", userId: 73 },
      messages: [],
    });

    const caller = appRouter.createCaller(createContext(73));
    await caller.chat.messages({ conversationId: "conversation-123" });

    expect(db.listConversationMessages).toHaveBeenCalledWith(73, "conversation-123");
  });
});
