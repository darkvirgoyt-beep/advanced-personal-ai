import { describe, expect, it } from "vitest";
import { filterOrganizableConversations, parseConversationFolderValue, shouldShowConversationEmptyState } from "./conversationOrganizer";

const conversations = [
  { sessionId: "legacy-session", title: "Earlier saved chat", folderId: null },
  { sessionId: "folder-session", title: "Client brief", folderId: 4 },
];

describe("NovaAI conversation organizer", () => {
  it("shows legacy-derived conversations and correctly filters all, inbox, and folder views", () => {
    expect(filterOrganizableConversations(conversations, "all")).toHaveLength(2);
    expect(filterOrganizableConversations(conversations, "unfiled")).toEqual([conversations[0]]);
    expect(filterOrganizableConversations(conversations, 4)).toEqual([conversations[1]]);
  });

  it("maps the folder selector back to Inbox safely and exposes the proper empty state", () => {
    expect(parseConversationFolderValue("")).toBeNull();
    expect(parseConversationFolderValue("4")).toBe(4);
    expect(parseConversationFolderValue("not-a-folder")).toBeNull();
    expect(shouldShowConversationEmptyState(false, 0)).toBe(true);
    expect(shouldShowConversationEmptyState(true, 0)).toBe(false);
  });
});
